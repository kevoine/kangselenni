# BudgetBuddy

A beginner-friendly student budgeting website built with HTML, CSS, and vanilla JavaScript.

## Files
- `index.html` — dashboard
- `allowance.html` — daily allowance records
- `expenses.html` — expense tracker
- `wallet.html` — separate e-wallet tracker
- `summary.html` — weekly/monthly totals
- `css/style.css` — shared design and responsive layout
- `js/script.js` — calculations, forms, editing/deleting, and localStorage
- `images/` — optional folder for your own image files

## Run in VS Code
1. Extract `BudgetBuddy.zip`.
2. Open Visual Studio Code.
3. Choose **File → Open Folder...** and select the extracted `BudgetBuddy` folder.
4. Open Extensions (the square icon on the left), search **Live Server** by Ritwick Dey, and install it.
5. Open `index.html`, right-click in the editor, and choose **Open with Live Server**.
6. Use the navigation bar to visit the other pages.

You can also double-click `index.html` to open it directly in a browser, though Live Server is recommended.

## Customize
- Change the four color variables at the top of `css/style.css`.
- Edit headings and labels directly in the relevant HTML file.
- To add images, place image files in `images/` and add an `<img>` tag to the desired page. The current design uses a lightweight emoji illustration so the pages work without external image dependencies.

## How calculations work
- The allowance is saved by date.
- Remaining daily balance = allowance for that date − expenses recorded for that date.
- The wallet is separate: starting wallet balance + money added − money spent.
- Weekly and monthly summaries include allowance and expenses whose dates fall within the selected week or month.
- Data is saved in your browser with `localStorage`. It remains after refresh in the same browser, but it is not synced to other devices.

## Test checklist
- [/] Open all five pages using the navigation bar.
- [/] Add an allowance for today and confirm the dashboard updates.
- [/] Edit and delete an allowance.
- [/] Add an expense, change its date/category, edit it, and delete it.
- [/] Confirm the remaining allowance changes when expenses change.
- [/] Set the wallet starting balance, add money, and spend money.
- [/] Try spending more than the tracked wallet balance.
- [/] Switch between weekly and monthly summaries and change the reference date.
- [/] Refresh a page and confirm saved data remains.
- [/] Resize the browser to check the mobile navigation and layout.
