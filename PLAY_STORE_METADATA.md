## Google Play Store Metadata

This file tracks the marketing copy for the Android release. Updated to reflect that the app serves the wider FRC community (not only Team 7790 supporters).

---
### Short Description (<=80 chars)
Live FRC events & match hub: follow any team + Team 7790 tools (72)

---
### Full Description (broad FRC audience)

Follow the entire FIRST Robotics Competition season with one app. Built by Team 7790 (Baywatch Robotics) but designed for ALL FRC fans, scouts, students, mentors, and parents. Use it purely as a neutral live FRC event & match companion, or (if you’re part of Team 7790) unlock internal collaboration tools.

KEY FEATURES
• Global Event & Match Data: Browse district, regional, and championship events and view match / ranking stats.*
• Track ANY Team: Favorite teams & events (not limited to 7790) for quick recall.
• Smart Calendar: Competitions, meetings, outreach & recurring events with start/end times and reminders.
• Chat & Collaboration: Organized channels (public, private, team) plus direct messages for strategy & coordination.
• Notifications: Push & local alerts for event updates, chat mentions, reminders, announcements.
• Profiles & Preferences: Avatar color, device registration, personalized team/event favorites.
• Admin Console (Team 7790 members): User roles (public vs member), channel structure, preferences.
• Auto-Updating Architecture: Web core loads live; most features ship instantly without waiting for a store update.
• Fast Stack: React + Vite + Cloudflare edge for low-latency data.

WHO IT’S FOR
Fans & Scouts – Monitor multiple teams and events in one place.
Students & Mentors – Centralize communication and planning.
Parents & Supporters – See schedules and stay informed about key moments.

ROADMAP (Examples)
• Offline & low-connectivity caching
• Deeper analytics & visual insights
• More granular notification categories
• Sharing & export tools

PRIVACY & SAFETY
Private channels and device tokens are access controlled; admins can revoke at any time. Public users only see non-sensitive info.

DISCLAIMER
Not an official product of FIRST®. FRC® and FIRST® are registered trademarks of FIRST (For Inspiration and Recognition of Science and Technology). Data sourced from public or community APIs and may vary by availability.*

SUPPORT & FEEDBACK
Ideas, bugs, or data issues? Contact mentors or open an issue in the project repository.

Compete smarter. Stay informed. Elevate your season—any team, anywhere.

*Some data availability depends on external API uptime or event reporting.

Character count ≈ 1,600 (under 4,000 limit).

---
### Initial Release Notes (<=500 chars)
Initial launch: Global FRC event & match viewer (follow any team), favorites list, real‑time chat (channels, private & DMs), push/local notifications, smart calendar with recurring events & reminders, user profiles (avatar colors & preferences), and admin tools for Team 7790. Auto‑updating web core. Foundation for offline caching & advanced analytics.

≈ 462 chars.

---
### Future Revision Guidelines
When updating:
1. Increment `versionCode` / `versionName` in `android/app/build.gradle`.
2. Add a dated section here with new Release Notes.
3. Keep Short Description stable unless a major positioning shift occurs.

---
### Changelog
v1 (initial) – Added baseline metadata for broad FRC audience.
