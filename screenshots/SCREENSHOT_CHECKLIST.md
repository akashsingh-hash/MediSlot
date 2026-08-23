# Screenshot Checklist for README

## All 11 Required Screenshots (Save in this folder)

### 1. landing-page.png
- **Page**: Homepage (logged out)
- **What to capture**: Full landing page with hero section, features
- **Recommended size**: 1920x1080 or 1440x900
- **Notes**: Make sure navbar and hero section are visible

### 2. patient-dashboard.png
- **Page**: Patient dashboard (logged in as patient)
- **What to capture**: Main dashboard with appointments tab
- **Show**: Upcoming appointments, quick actions
- **Notes**: Include some sample appointment data

### 3. doctor-booking.png
- **Page**: Doctor booking flow
- **What to capture**: Doctor list or slot selection screen
- **Show**: Available doctors with their info and available slots
- **Notes**: Show the slot selection UI with some available times

### 4. ai-summary.png
- **Page**: Doctor's appointment view
- **What to capture**: Appointment card with AI-generated summary
- **Show**: Urgency badge (HIGH/MEDIUM/LOW), chief complaint, suggested questions
- **Notes**: Make sure the AI summary section is clearly visible with all three components

### 5. calendar-integration.png
- **Page**: Settings → Google Calendar OR Google Calendar itself
- **What to capture**: Either:
  - Option A: Settings page showing "Connected" status
  - Option B: Google Calendar showing MediSlot appointments
- **Show**: Proof that appointments sync to calendar
- **Notes**: If showing Google Calendar, highlight the MediSlot events

### 6. medication-reminders.png
- **Page**: Medications tab OR Google Calendar with medication reminders
- **What to capture**: Medication list with reminders
- **Show**: Medication names, dosages, times, and calendar sync
- **Notes**: If showing calendar, make sure medication events with 💊 icon are visible

### 7. admin-dashboard.png
- **Page**: Admin dashboard (logged in as admin)
- **What to capture**: Full admin panel
- **Show**: Metrics, doctor list, management options
- **Notes**: Include statistics cards at the top

### 8. dark-mode.png
- **Page**: Any page in dark mode
- **What to capture**: Same as patient-dashboard but in dark theme
- **Show**: How beautiful the dark mode looks
- **Notes**: Toggle to dark mode first (click theme toggle in navbar)

### 9. mobile-view.png ⭐
- **Page**: Any page (patient dashboard recommended)
- **What to capture**: Mobile responsive view
- **Device**: Use browser dev tools (F12) → Device toolbar
- **Recommended**: iPhone 13 Pro or similar (375x812)
- **Show**: Navigation, appointment cards, responsive layout
- **Notes**: Shows responsive design and touch-friendly UI

### 10. prescription-detail.png ⭐
- **Page**: Prescription detail view (click on a prescription from medications tab)
- **What to capture**: Complete prescription with medications
- **Show**: Doctor info, medications list with doses, prescription date
- **Notes**: Should show full prescription details in a card or modal

### 11. messages.png ⭐
- **Page**: Messages/notifications section
- **What to capture**: Messaging interface or notification badge in action
- **Show**: Doctor-patient communication, unread count, message list
- **Notes**: Capture the notification bell with badge or messages panel open

## How to Take Screenshots

### Windows
1. **Full Screen**: Press `Windows + Shift + S` → Select area
2. **Save**: Paste in Paint → Save as PNG
3. **Rename**: Use the exact filename from the list above

### Chrome DevTools (for mobile screenshot #9)
1. Press `F12` → Click device icon (or Ctrl+Shift+M)
2. Select device (iPhone 13 Pro)
3. Take screenshot using Windows method

### Save Location
Save all screenshots in: `./screenshots/`

## After Taking Screenshots

1. Check that all 11 screenshots are taken
2. Verify filenames match exactly (including lowercase)
3. Commit to Git:
   ```bash
   git add screenshots/
   git commit -m "Add README screenshots"
   git push origin main
   ```

## Tips for Great Screenshots

- ✅ Use real-looking data (not "test test test")
- ✅ Make sure UI is fully loaded (no loading spinners)
- ✅ Hide sensitive information (use demo account)
- ✅ Capture in good lighting (clear, crisp images)
- ✅ Full-screen browser (F11) for cleaner shots
- ✅ Close unnecessary browser tabs
- ✅ Use light mode for most screenshots (except dark-mode.png)
- ✅ For mobile view, make sure to show full interface

---

**Status**: [ ] Complete - Once all 11 screenshots are added, check this box!
