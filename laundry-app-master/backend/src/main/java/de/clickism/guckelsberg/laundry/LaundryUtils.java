package de.clickism.guckelsberg.laundry;

import java.time.LocalDate;
import java.util.Calendar;

import static de.clickism.guckelsberg.laundry.LaundryMachine.BASE_SLOT_DURATION;

public class LaundryUtils {

    /**
     * Gets the current time slot in minutes since midnight.
     */
    public static int getCurrentSlot() {
        int minutes = Calendar.getInstance().get(Calendar.MINUTE);
        int hours = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        return hours * 60 + minutes;
    }

    public static int lastSlotOfDay() {
        return 1440 - BASE_SLOT_DURATION;
    }

    public static String formatSlot(int slot) {
        int hours = slot / 60;
        int minutes = slot % 60;
        return String.format("%d:%02d", hours, minutes);
    }

    public static String formatSlot(int slot, LocalDate date) {
        return date + " " + formatSlot(slot);
    }
}
