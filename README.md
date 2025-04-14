# SmartSplit - Expense Sharing App

SmartSplit is a simple web application that helps you and your friends track and split expenses during trips or other shared activities. It keeps track of who paid for what and calculates who owes whom to simplify repayments.

## Features

- **Add and manage group members** - Add everyone who's sharing expenses
- **Record expenses** - Track who paid and how the expense is split
- **Custom split options** - Equal split or custom split amounts
- **Smart balance calculation** - See who owes what at a glance
- **Simplified settlements** - Optimizes repayments to minimize the number of transactions
- **Settlement recording** - Track when people settle up
- **Works offline** - Data is stored locally in your browser

## How to Use

### Getting Started

1. Open the `index.html` file in a web browser
2. Add group members by clicking on the "Members" tab
3. Start recording expenses

### Adding Members

1. Go to the "Members" tab
2. Click "Add Member"
3. Enter the person's name (and optionally their email)
4. Click "Save"

### Recording Expenses

1. Go to the "Add Expense" tab
2. Fill in the expense details:
   - Description (what was the expense for?)
   - Amount
   - Who paid
   - Split between which members
   - Split type (equal or custom amounts)
   - Date
3. Click "Add Expense"

### Settling Up

1. Go to the "Settlements" tab
2. Review the suggested settlements
3. Either:
   - Click "Record this settlement" on a suggestion, or
   - Manually enter settlement details
4. The dashboard will update to reflect the new balances

## Sharing with Friends

Since this is a static web app, there are several ways to share it with your friends:

1. **Host it on a static web hosting service** like GitHub Pages, Netlify, or Vercel
2. **Share the files directly** via email, file sharing, or USB drive
3. **Use a local file server** while you're together on the same network

Note that the data is stored in your browser's localStorage, so your data won't be shared across devices automatically. This is by design for privacy and simplicity.

## Development

This app is built with plain HTML, CSS, and JavaScript, with Bootstrap for styling. 

No build tools or special setup is required. To make changes:

1. Edit the HTML, CSS, or JavaScript files
2. Refresh the browser to see your changes

## Future Improvements

- Add a backend to sync data across devices
- Implement user authentication
- Add ability to create multiple groups
- Add receipt photo uploads
- Export data to CSV/PDF
- Add currency conversion

## License

MIT License - Feel free to use, modify, and distribute as you like!