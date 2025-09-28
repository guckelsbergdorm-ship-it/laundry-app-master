import {useEffect, useMemo, useState} from "react";
import styles from "./BulkGenerateUsers.module.css";
import {MessageBox, type Message} from "../../../components/MessageBox.tsx";
import {Button} from "../../../components/Button.tsx";
import {ROLES, type Role, DEFAULT_DOUBLE_OCCUPANCY_ROOMS, type BulkGenerationResponse} from "../../user/models.ts";
import {useBulkGenerateUsers} from "../../user/queries.ts";

const FLOOR_MIN = 0;
const FLOOR_MAX = 99;
const ROOM_MIN = 0;
const ROOM_MAX = 99;

function parseDoubleRooms(input: string): Set<number> {
  const values = input.split(/[,\s]+/).map(value => value.trim()).filter(Boolean);
  const doubles = new Set<number>();
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      doubles.add(parsed);
    }
  }
  return doubles;
}

function pad(value: number, length: number) {
  return value.toString().padStart(length, "0");
}

function generateBuildingRooms(
  floorStart: number,
  floorEnd: number,
  roomStart: number,
  roomEnd: number,
  doubleRoomsInput: string,
  occupantPadding: number,
  floorPad = 2,
  roomPad = 2,
): string[] {
  const padding = Number.isFinite(occupantPadding) ? Math.max(1, Math.floor(occupantPadding)) : 1;
  const doubles = parseDoubleRooms(doubleRoomsInput);
  const accounts: string[] = [];
  const [startFloor, endFloor] = floorStart <= floorEnd ? [floorStart, floorEnd] : [floorEnd, floorStart];
  const [startRoom, endRoom] = roomStart <= roomEnd ? [roomStart, roomEnd] : [roomEnd, roomStart];
  for (let floor = startFloor; floor <= endFloor; floor++) {
    for (let room = startRoom; room <= endRoom; room++) {
      const occupantCount = doubles.has(room) ? 2 : 1;
      for (let occupant = 1; occupant <= occupantCount; occupant++) {
        accounts.push(
          `${pad(floor, floorPad)}-${pad(room, roomPad)}-${pad(occupant, padding)}`
        );
      }
    }
  }
  return accounts;
}

function sortRooms(rooms: string[]): string[] {
  return [...rooms].sort((a, b) => {
    const aParts = a.split("-");
    const bParts = b.split("-");
    const [aFloor, aRoom, aOccupant] = aParts.map(part => Number(part.replace(/\D/g, "")));
    const [bFloor, bRoom, bOccupant] = bParts.map(part => Number(part.replace(/\D/g, "")));
    if (aFloor !== bFloor) {
      return aFloor - bFloor;
    }
    if (aRoom !== bRoom) {
      return aRoom - bRoom;
    }
    return (aOccupant || 0) - (bOccupant || 0);
  });
}

function parseManualRooms(input: string): string[] {
  return input
    .split(/[\n,;\s]+/)
    .map(value => value.trim())
    .filter(Boolean);
}

export function BulkGenerateUsers() {
  const [startFloor, setStartFloor] = useState(0);
  const [endFloor, setEndFloor] = useState(11);
  const [roomStart, setRoomStart] = useState(0);
  const [roomEnd, setRoomEnd] = useState(9);
  const [doubleRoomsInput, setDoubleRoomsInput] = useState(DEFAULT_DOUBLE_OCCUPANCY_ROOMS.join(","));
  const [occupantPadding, setOccupantPadding] = useState(2);
  const [passwordLength, setPasswordLength] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [role, setRole] = useState<Role>('USER');
  const [maxWasher, setMaxWasher] = useState<string>('');
  const [maxDryer, setMaxDryer] = useState<string>('');
  const [customRooms, setCustomRooms] = useState('');

  const [message, setMessage] = useState<Message | undefined>();
  const [result, setResult] = useState<BulkGenerationResponse | null>(null);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);

  const {mutateAsync: bulkGenerate, isPending} = useBulkGenerateUsers();

  useEffect(() => {
    return () => {
      if (csvUrl) {
        URL.revokeObjectURL(csvUrl);
      }
    };
  }, [csvUrl]);

  const generatedRooms = useMemo(() => {
    const buildingRooms = generateBuildingRooms(
      startFloor,
      endFloor,
      roomStart,
      roomEnd,
      doubleRoomsInput,
      occupantPadding,
    );
    const manualRooms = parseManualRooms(customRooms);
    const unique = new Map<string, string>();
    for (const room of [...buildingRooms, ...manualRooms]) {
      if (room) {
        unique.set(room, room);
      }
    }
    return sortRooms([...unique.values()]);
  }, [startFloor, endFloor, roomStart, roomEnd, doubleRoomsInput, occupantPadding, customRooms]);

  const totalRooms = generatedRooms.length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    setResult(null);
    if (csvUrl) {
      URL.revokeObjectURL(csvUrl);
      setCsvUrl(null);
    }

    if (generatedRooms.length === 0) {
      setMessage({type: 'error', text: 'No rooms were generated. Adjust the ranges or add manual entries.'});
      return;
    }
    const payload = {
      rooms: generatedRooms,
      overwriteExisting: overwriteExisting || undefined,
      role: role === 'USER' ? undefined : role,
      maxWasherMinutesPerWeek: maxWasher ? Number(maxWasher) : undefined,
      maxDryerMinutesPerWeek: maxDryer ? Number(maxDryer) : undefined,
      passwordLength: passwordLength ? Number(passwordLength) : undefined,
    };

    try {
      const data = await bulkGenerate(payload);
      setResult(data);
      setMessage({
        type: 'success',
        text: (
          <span>
            Accounts generated successfully. Created {data.created}, updated {data.updated}, skipped {data.skipped}.
          </span>
        ),
      });
      const csvLines = ["roomNumber,password,status", ...data.credentials.map(cred => (
        `${cred.roomNumber},${cred.password ?? ''},${cred.status}`
      ))];
      const blob = new Blob([csvLines.join("\n")], {type: 'text/csv'});
      setCsvUrl(URL.createObjectURL(blob));
    } catch (error) {
      setMessage({type: 'error', text: error instanceof Error ? error.message : 'Failed to generate accounts'});
    }
  }

  const handleDownload = () => {
    if (!csvUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = `laundry-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className={styles.container}>
      <div>
        <h2>Bulk Account Generator</h2>
        <p>
          Configure the floor and room ranges to generate resident accounts. Rooms listed in the double-occupancy field
          will produce two accounts per apartment (e.g. 02-04-01 and 02-04-02). You can also add manual room numbers
          below for special cases.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="startFloor">Start floor</label>
            <input
              id="startFloor"
              type="number"
              min={FLOOR_MIN}
              max={FLOOR_MAX}
              value={startFloor}
              onChange={event => setStartFloor(Number(event.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endFloor">End floor</label>
            <input
              id="endFloor"
              type="number"
              min={FLOOR_MIN}
              max={FLOOR_MAX}
              value={endFloor}
              onChange={event => setEndFloor(Number(event.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="roomStart">First room per floor</label>
            <input
              id="roomStart"
              type="number"
              min={ROOM_MIN}
              max={ROOM_MAX}
              value={roomStart}
              onChange={event => setRoomStart(Number(event.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="roomEnd">Last room per floor</label>
            <input
              id="roomEnd"
              type="number"
              min={ROOM_MIN}
              max={ROOM_MAX}
              value={roomEnd}
              onChange={event => setRoomEnd(Number(event.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="doubleRooms">Double-occupancy rooms</label>
            <input
              id="doubleRooms"
              type="text"
              value={doubleRoomsInput}
              onChange={event => setDoubleRoomsInput(event.target.value)}
              placeholder="00,01,04,05,08,09"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="occupantPadding">Occupant padding</label>
            <input
              id="occupantPadding"
              type="number"
              min={1}
              max={4}
              value={occupantPadding}
              onChange={event => {
                const value = Number(event.target.value);
                setOccupantPadding(Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1);
              }}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={event => setRole(event.target.value as Role)}>
              {ROLES.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="passwordLength">Password length</label>
            <input
              id="passwordLength"
              type="number"
              min={8}
              placeholder="12"
              value={passwordLength}
              onChange={event => setPasswordLength(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="maxWasher">Max washer minutes/week</label>
            <input
              id="maxWasher"
              type="number"
              min={0}
              value={maxWasher}
              onChange={event => setMaxWasher(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="maxDryer">Max dryer minutes/week</label>
            <input
              id="maxDryer"
              type="number"
              min={0}
              value={maxDryer}
              onChange={event => setMaxDryer(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="overwrite">
              <input
                id="overwrite"
                type="checkbox"
                checked={overwriteExisting}
                onChange={event => setOverwriteExisting(event.target.checked)}
              />{' '}
              Overwrite existing accounts
            </label>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="customRooms">Manual room numbers (optional)</label>
          <textarea
            id="customRooms"
            placeholder="One room per line or separated by commas"
            value={customRooms}
            onChange={event => setCustomRooms(event.target.value)}
          />
        </div>

        <div className={styles.summaryRow}>
          <span>{`Unique accounts to generate: ${totalRooms}`}</span>
          <span>{`Floors: ${Math.abs(endFloor - startFloor) + 1}`}</span>
          <span>{`Rooms per floor: ${Math.abs(roomEnd - roomStart) + 1}`}</span>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Generating…' : 'Generate accounts'}
          </Button>
          {csvUrl && (
            <Button type="button" onClick={handleDownload}>
              Download CSV
            </Button>
          )}
        </div>
      </form>

      <MessageBox message={message}/>

      {result && (
        <div>
          <div className={styles.counts}>
            <span>{`Created: ${result.created}`}</span>
            <span>{`Updated: ${result.updated}`}</span>
            <span>{`Skipped: ${result.skipped}`}</span>
          </div>
          <div className={styles.tableWrapper}>
            <table>
              <thead>
              <tr>
                <th>Room</th>
                <th>Password</th>
                <th>Status</th>
              </tr>
              </thead>
              <tbody>
              {result.credentials.map((credential) => (
                <tr key={credential.roomNumber}>
                  <td>{credential.roomNumber}</td>
                  <td>{credential.password ?? ''}</td>
                  <td>{credential.status}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}