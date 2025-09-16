# El-Node Inventory Management

El-Node is a modern inventory management system built with Next.js and TypeScript. It allows users to manage products, assign them to specific rooms (destinations), track their status, and organize categories for efficient asset management.

## Features

- **Product Management:** Add, edit, search, and filter products with unique codes, categories, and descriptions.
- **Room Assignment:** Assign products to specific rooms (destinations) and easily switch products between rooms.
- **Destination Management:** Create, edit, and delete rooms. Assign products to rooms during creation and manage products within each room.
- **Category Management:** Organize products by categories with short codes.
- **Status Tracking:** Monitor product status (active, maintenance, damaged, discarded, missing) and update as needed.
- **User Roles:** Admin and user roles with permission-based actions.
- **Dashboard Overview:** View key metrics and inventory status at a glance.
- **Modern UI:** Responsive design using Tailwind CSS and Radix UI components.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- pnpm (or npm/yarn)

### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd module_1
   ```
2. Install dependencies:
   ```sh
   pnpm install
   # or
   npm install
   ```
3. Start the development server:
   ```sh
   pnpm dev
   # or
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
module_1/
├── app/                  # Next.js app directory
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # App layout
│   └── page.tsx          # Main page
├── components/           # React components
│   ├── dashboard.tsx     # Dashboard UI
│   ├── product-management.tsx
│   ├── destination-management.tsx
│   ├── category-management.tsx
│   ├── ui/               # UI primitives (Button, Badge, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Business logic and services
├── public/               # Static assets
├── styles/               # Additional styles
├── package.json          # Project metadata and scripts
├── tsconfig.json         # TypeScript configuration
└── ...
```

## Usage
- **Add Products:** Go to the Products tab, click "Add Product", fill in details, and assign to a room if needed.
- **Manage Rooms:** Go to the Destinations tab, create new rooms, and assign products during creation or later.
- **Move Products:** Use the dropdown in the products table or room view to switch a product's room.
- **Track Status:** Update product status from the table dropdown.

## Customization
- Change primary color in `app/globals.css` by editing the `--primary` CSS variable.
- Add new categories and rooms as needed.

## Contributing
Pull requests and suggestions are welcome! Please open issues for bugs or feature requests.

## License
MIT
