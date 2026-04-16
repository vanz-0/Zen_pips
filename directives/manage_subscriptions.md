# Directive: Manage Subscriptions

## Goal
Manage VIP tier subscriptions, handle manual verifications, and monitor pending payments in the local Zen Pips database.

## Inputs
- User context (Telegram Username, or TxID, or internal User ID)
- Desired action (List pending, Approve user, Reject user, Revoke access, Check status)

## Available Execution Scripts
All scripts are located in `execution/` and interface with `.tmp/zenpips.db`.
- `execution/db_setup.py`: Generates the database structure.
- `execution/list_pending.py`: (To Be Built) Outputs all users waiting for TxID approval.
- `execution/approve_payment.py`: (To Be Built) Approves a pending user and generates their invite link.

## Expected Workflow
1. When the user (admin) asks to check for payments, run the `list_pending.py` script.
2. Present the pending TxIDs to the admin.
3. If admin says "Approve user X", immediately call `approve_payment.py` providing the necessary user identifier.
4. Report the resulting success/failure to the admin.
