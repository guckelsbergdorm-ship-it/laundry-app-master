#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import http.cookiejar
import json
import os
import secrets
from pathlib import Path
import sys
import urllib.error
import urllib.request

DEFAULT_PASSWORD_LENGTH = 12
MIN_PASSWORD_LENGTH = 8
PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
DEFAULT_DOUBLE_OCCUPANCY_ROOMS = "00,01,04,05,08,09"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate laundry app accounts for a list of rooms via the admin API."
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("LAUNDRY_APP_HOST", "http://localhost:8080"),
        help="Base URL of the laundry backend (default: %(default)s)",
    )
    parser.add_argument(
        "--admin-room",
        default=os.environ.get("LAUNDRY_APP_ADMIN_ROOM", "admin"),
        help="Master admin room number used for authentication",
    )
    parser.add_argument(
        "--admin-password",
        default=os.environ.get("LAUNDRY_APP_ADMIN_PASSWORD", "guckelsberg"),
        help="Master admin password used for authentication",
    )
    parser.add_argument(
        "--rooms",
        nargs="*",
        help="Room numbers to create. Can be provided multiple times.",
    )
    parser.add_argument(
        "--rooms-file",
        type=Path,
        help="Path to a text file containing one room number per line.",
    )
    parser.add_argument(
        "--layout",
        help=(
            "Compact layout description, e.g. '01:01-20;02:01-20;P:1-2'. "
            "Generates room numbers by concatenating the floor prefix with each unit."
        ),
    )
    parser.add_argument(
        "--building",
        action="store_true",
        help="Generate room numbers for the whole building using range + occupancy options.",
    )
    parser.add_argument(
        "--floor-range",
        default="00-11",
        help="Floor range for --building mode (inclusive, e.g. '00-11').",
    )
    parser.add_argument(
        "--room-range",
        default="00-09",
        help="Room/apartment range per floor for --building mode (inclusive, e.g. '00-09').",
    )
    parser.add_argument(
        "--double-rooms",
        default=DEFAULT_DOUBLE_OCCUPANCY_ROOMS,
        help=(
            "Comma-separated room numbers (per floor) that host two residents. "
            "Defaults to '00,01,04,05,08,09'."
        ),
    )
    parser.add_argument(
        "--occupant-padding",
        type=int,
        default=2,
        help="Digits to use when padding occupant suffix (default: 2, producing '-01').",
    )
    parser.add_argument(
        "--password-length",
        type=int,
        help="Password length to use for generated accounts (minimum 8).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing users with new passwords.",
    )
    parser.add_argument(
        "--role",
        choices=[
            "USER",
            "STAFF",
            "LAUNDRY_ADMIN",
            "ROOFTOP_ADMIN",
            "MASTER_ADMIN",
        ],
        help="Assign a specific role to the generated accounts (default: USER).",
    )
    parser.add_argument(
        "--max-washer",
        type=int,
        help="Set max washer minutes per week for all generated accounts.",
    )
    parser.add_argument(
        "--max-dryer",
        type=int,
        help="Set max dryer minutes per week for all generated accounts.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview account generation locally without calling the API (still prints CSV).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write the generated credentials as CSV.",
    )
    return parser.parse_args()


def read_rooms_from_file(path: Path) -> list[str]:
    rooms: list[str] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            value = line.strip()
            if not value or value.startswith("#"):
                continue
            rooms.append(value)
    return rooms


def expand_layout(spec: str) -> list[str]:
    rooms: list[str] = []
    for block in spec.split(";"):
        block = block.strip()
        if not block:
            continue
        if ":" not in block:
            raise ValueError(f"Invalid layout block: '{block}'")
        floor, units_spec = block.split(":", 1)
        floor = floor.strip()
        if not floor:
            raise ValueError(f"Invalid floor prefix in block: '{block}'")
        for part in units_spec.split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                start, end = part.split("-", 1)
                start = start.strip()
                end = end.strip()
                if not start or not end:
                    raise ValueError(f"Invalid range '{part}' in block '{block}'")
                start_value = int(start)
                end_value = int(end)
                step = 1 if end_value >= start_value else -1
                width = max(len(start), len(end))
                for value in range(start_value, end_value + step, step):
                    rooms.append(f"{floor}{value:0{width}d}")
            else:
                rooms.append(f"{floor}{part}")
    return rooms


def parse_numeric_range(spec: str) -> tuple[list[int], int]:
    cleaned = spec.strip()
    if not cleaned:
        raise ValueError("Numeric range cannot be empty.")
    if "-" not in cleaned:
        value = int(cleaned)
        width = len(cleaned)
        return [value], max(width, 1)
    start_str, end_str = cleaned.split("-", 1)
    if not start_str or not end_str:
        raise ValueError(f"Invalid numeric range: '{spec}'")
    start = int(start_str)
    end = int(end_str)
    step = 1 if end >= start else -1
    values = list(range(start, end + step, step))
    width = max(len(start_str), len(end_str))
    return values, max(width, 1)


def parse_double_rooms(spec: str) -> set[int]:
    rooms: set[int] = set()
    for part in spec.split(","):
        cleaned = part.strip()
        if not cleaned:
            continue
        rooms.add(int(cleaned))
    return rooms


def generate_building_rooms(
    floor_spec: str,
    room_spec: str,
    double_spec: str,
    occupant_padding: int,
) -> list[str]:
    floors, floor_width = parse_numeric_range(floor_spec)
    rooms, room_width = parse_numeric_range(room_spec)
    doubles = parse_double_rooms(double_spec)

    generated: list[str] = []
    for floor in floors:
        for room in rooms:
            occupants = 2 if room in doubles else 1
            for index in range(1, occupants + 1):
                generated.append(
                    f"{floor:0{floor_width}d}-{room:0{room_width}d}-{index:0{occupant_padding}d}"
                )
    return generated


def generate_password(length: int) -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def collect_rooms(args: argparse.Namespace) -> list[str]:
    rooms: list[str] = []
    if args.rooms:
        rooms.extend(args.rooms)
    if args.rooms_file:
        rooms.extend(read_rooms_from_file(args.rooms_file))
    if args.layout:
        rooms.extend(expand_layout(args.layout))
    if getattr(args, "building", False):
        rooms.extend(
            generate_building_rooms(
                args.floor_range,
                args.room_range,
                args.double_rooms,
                args.occupant_padding,
            )
        )
    deduplicated = list(dict.fromkeys(room.strip() for room in rooms if room and room.strip()))
    if not deduplicated:
        raise ValueError(
            "No room numbers were provided. Use --rooms, --rooms-file, --layout, or --building."
        )
    return deduplicated


def build_opener() -> urllib.request.OpenerDirector:
    cookie_jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))


def perform_login(opener: urllib.request.OpenerDirector, host: str, room: str, password: str) -> None:
    request = urllib.request.Request(
        url=f"{host.rstrip('/')}/auth/login",
        data=json.dumps({"roomNumber": room, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        opener.open(request)
    except urllib.error.HTTPError as error:
        if error.code == 401:
            raise RuntimeError("Login failed: invalid admin credentials") from error
        raise


def call_generation_endpoint(
    opener: urllib.request.OpenerDirector,
    host: str,
    payload: dict,
) -> dict:
    request = urllib.request.Request(
        url=f"{host.rstrip('/')}/api/users/bulk/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with opener.open(request) as response:
        return json.load(response)


def print_table(rows: list[dict]) -> None:
    headers = ["Room", "Password", "Status"]
    widths = [len(header) for header in headers]
    for row in rows:
        widths[0] = max(widths[0], len(str(row.get("roomNumber", ""))))
        password = row.get("password") or ""
        widths[1] = max(widths[1], len(password))
        widths[2] = max(widths[2], len(str(row.get("status", ""))))
    line = " | ".join(header.ljust(width) for header, width in zip(headers, widths))
    separator = "-+-".join("-" * width for width in widths)
    print(line)
    print(separator)
    for row in rows:
        password = row.get("password") or ""
        print(
            " | ".join(
                [
                    str(row.get("roomNumber", "")).ljust(widths[0]),
                    password.ljust(widths[1]),
                    str(row.get("status", "")).ljust(widths[2]),
                ]
            )
        )


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["roomNumber", "password", "status"])
        for row in rows:
            writer.writerow([
                row.get("roomNumber", ""),
                row.get("password", ""),
                row.get("status", ""),
            ])


def main() -> None:
    args = parse_arguments()
    if args.occupant_padding is not None and args.occupant_padding < 1:
        print("Error: --occupant-padding must be at least 1.", file=sys.stderr)
        raise SystemExit(2)
    if args.password_length is not None and args.password_length < MIN_PASSWORD_LENGTH:
        print(
            f"Error: password length must be at least {MIN_PASSWORD_LENGTH} characters.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    try:
        rooms = collect_rooms(args)
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(2) from error

    if args.dry_run:
        password_length = args.password_length or DEFAULT_PASSWORD_LENGTH
        credentials = [
            {
                "roomNumber": room,
                "password": generate_password(password_length),
                "status": "PREVIEW",
            }
            for room in rooms
        ]
        response = {
            "created": len(rooms),
            "updated": 0,
            "skipped": 0,
            "credentials": credentials,
        }
    else:
        opener = build_opener()
        try:
            perform_login(opener, args.host, args.admin_room, args.admin_password)
        except Exception as error:
            print(f"Authentication failed: {error}", file=sys.stderr)
            raise SystemExit(1) from error

        payload: dict = {"rooms": rooms}
        if args.password_length is not None:
            payload["passwordLength"] = args.password_length
        if args.overwrite:
            payload["overwriteExisting"] = True
        if args.role:
            payload["role"] = args.role
        if args.max_washer is not None:
            payload["maxWasherMinutesPerWeek"] = args.max_washer
        if args.max_dryer is not None:
            payload["maxDryerMinutesPerWeek"] = args.max_dryer

        try:
            response = call_generation_endpoint(opener, args.host, payload)
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            print(f"API error ({error.code}): {details}", file=sys.stderr)
            raise SystemExit(1) from error

        credentials = response.get("credentials", [])
        if not isinstance(credentials, list):
            print("Unexpected response from server.", file=sys.stderr)
            raise SystemExit(1)

    print_table(credentials)
    print()
    print(
        "Summary: created={created} updated={updated} skipped={skipped}".format(
            created=response.get("created", 0),
            updated=response.get("updated", 0),
            skipped=response.get("skipped", 0),
        )
    )

    if args.output:
        write_csv(args.output, credentials)
        print(f"Credentials written to {args.output}")


if __name__ == "__main__":
    main()