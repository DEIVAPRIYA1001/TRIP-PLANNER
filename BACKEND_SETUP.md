# TRIP-MATE PHP + MySQL backend (XAMPP)

## Included
- `php/config.php`: PDO MySQL configuration
- `php/schema.sql`: database and tables (`users`, `trip_requests`, `wishlist`)
- `php/api.php`: registration, login, logout, session lookup, trip requests, authenticated trip history, and wishlist endpoints
- The trip request form in `script.js` now submits to the PHP API instead of only showing a local success message.

## Install on Windows/XAMPP
1. Extract the complete `TRIP-MATE` folder into `C:\xampp\htdocs\TRIP-MATE`.
2. Open XAMPP Control Panel and start **Apache** and **MySQL**.
3. Open `http://localhost/phpmyadmin`.
4. Select **Import**, choose `C:\xampp\htdocs\TRIP-MATE\php\schema.sql`, and run it. This creates the `tripmate` database and tables.
5. Check `php/config.php`. Default XAMPP is usually user `root` with an empty password. Change the settings if yours differ.
6. Open `http://localhost/TRIP-MATE/`. Do not use Python's `http.server` for PHP; it cannot execute PHP.
7. Click **Log in** in the top navigation, create an account, then add a destination using its heart button. In phpMyAdmin, check `tripmate.wishlist` for a row linked to your user ID.\n8. Submit the Plan your trip form. A successful database insert returns a `TM-<id>` reference. This is a trip-request reference, not a confirmed commercial booking.

## API routes
All routes are relative to `php/api.php`:
- `POST ?action=register` JSON `{ "name":"Example User", "email":"user@example.com", "password":"ChangeMe123!" }`
- `POST ?action=login` JSON `{ "email":"user@example.com", "password":"ChangeMe123!" }`
- `POST ?action=logout`
- `GET ?action=me`
- `POST ?action=trip` JSON with `name`, `email`, `phone`, `travel_date` (YYYY-MM-DD), optional `departure_time`, `travellers`, `trip_type`, `interests` array and `notes`. Login is not required for submitting a trip request.
- `GET ?action=my-trips` (login required)
- `GET ?action=wishlist` (login required)
- `POST ?action=wishlist` JSON `{ "destination_id":"bali" }` (login required)
- `DELETE ?action=wishlist&destination_id=bali` (login required)

## Security notes before public deployment
- Set a strong database password and keep configuration/secrets outside public source control.
- Add CSRF tokens to state-changing session-authenticated endpoints, rate limiting, email verification, password reset, and account lockout protections before public deployment.
- Use HTTPS in production. Do not store plaintext passwords; this backend uses PHP `password_hash` / `password_verify`.
- The existing frontend profile password field is not used to create an account. Use the registration API from a dedicated registration UI before expecting user accounts to exist.
- Wishlist and trip history require login; the current frontend wishlist remains browser-local until connected to these endpoints.
