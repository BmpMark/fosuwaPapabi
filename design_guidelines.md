# Hotel Management System - Design Guidelines

## Design Approach
**Reference-Based: Airbnb + Booking.com Inspiration**

Drawing from hospitality industry leaders to create an experience-focused design that balances visual appeal with booking efficiency. The system serves both guests (booking) and hotel staff (management).

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent readability
- **Display**: 48px-72px bold for hero headlines
- **Headings**: 24px-36px semibold for section titles
- **Body**: 16px regular, 18px for important descriptions
- **Small**: 14px for metadata, labels, fine print

## Layout & Spacing
**Spacing Scale**: Tailwind units 4, 6, 8, 12, 16, 24
- Section padding: py-16 desktop, py-12 mobile
- Card spacing: p-6 to p-8
- Component gaps: gap-6 standard, gap-8 for major sections
- Container: max-w-7xl for main content areas

## Page Structures

### Guest-Facing Pages

**Homepage**
1. **Hero Section** (80vh): Full-width stunning hotel exterior/interior image with blurred-background search widget overlay centered
2. **Featured Rooms Grid**: 3-column grid (2-col tablet, 1-col mobile) with large room images, pricing, key amenities
3. **Experience Showcase**: 2-column alternating image-text layout highlighting unique hotel features (spa, restaurant, rooftop, pool)
4. **Amenities Grid**: 4-column icon-based grid (2-col mobile)
5. **Location & Contact**: Split layout - map on left (60%), contact details on right (40%)

**Room Listing Page**
- Filters sidebar (25% width desktop, drawer on mobile): Price range, room type, capacity, amenities checkboxes
- Room cards (75% width): Large hero image, gallery thumbnails, pricing prominently displayed, quick booking CTA, expandable details

**Booking Flow**
- Multi-step progress indicator (4 steps: Dates → Room → Details → Confirm)
- Large calendar widget with date range selection
- Guest information form (2-column layout)
- Booking summary sticky card showing room details, dates, pricing breakdown

### Management Dashboard

**Dashboard Home**
- Stats cards row: 4-column grid showing occupancy rate, today's check-ins/outs, revenue, pending bookings
- Charts section: Large occupancy timeline chart, room type distribution donut
- Recent activity feed: Card-based list with booking updates, staff actions

**Reservations Management**
- Data table with advanced filters (date range picker, status badges, room type)
- Quick actions: Check-in, Check-out, Modify, Cancel buttons
- Detail panel (slides from right): Full reservation info, guest details, payment history, room assignment

**Room Management**
- Visual room grid showing availability status (color-coded: Available, Occupied, Maintenance, Cleaning)
- Room details modal: Images carousel, amenities checklist, pricing editor, maintenance log

## Component Library

**Navigation**
- Guest: Transparent over hero, solid white on scroll, logo left, nav links center, Book Now CTA right
- Dashboard: Fixed sidebar (240px) with collapsible sections, top bar with search and user menu

**Cards**
- Room cards: 4:3 aspect ratio image, overlay gradient for text readability, pricing badge top-right, hover lift effect
- Booking cards: White background, subtle shadow, status indicator dot, clear date/guest info hierarchy

**Forms**
- Date picker: Calendar grid with range selection, clear disabled dates
- Guest count selector: Stepper buttons for adults/children
- Input fields: Floating labels, clear validation states, helper text below

**Buttons**
- Primary: Bold, full rounded corners (rounded-full), generous padding (px-8 py-3)
- Over images: Backdrop blur (backdrop-blur-md), semi-transparent white background
- Secondary: Outlined style with border

**Modals & Overlays**
- Booking confirmation: Centered, max-w-2xl, includes booking summary, payment details, confirmation number
- Image galleries: Full-screen lightbox with thumbnails strip

## Images Section

**Large Hero Image**: Yes - Full-width hotel exterior or signature interior space (lobby, pool view). Should be high-quality, professionally shot, showcasing the property's best angle during golden hour or with dramatic lighting.

**Additional Images**:
- Room cards: 6-8 professionally styled room photos per room type
- Amenities section: 4-6 lifestyle images (guests using spa, dining, pool)
- Experience section: 3-4 large feature images
- Dashboard: Room thumbnails for quick identification

Image treatment: Subtle overlay gradients on cards for text legibility, rounded corners (rounded-lg) for all images except full-width hero.

## Data Visualization
- Occupancy charts: Line graph with gradient fill
- Revenue metrics: Bar charts with color-coded categories
- Status indicators: Color-coded badges (green=available, blue=occupied, yellow=maintenance, red=cleaning)

## Interactions (Minimal)
- Smooth scroll to sections
- Card hover: Subtle lift (transform translateY)
- Image galleries: Fade transitions only
- Modal entry: Scale from 95% to 100%

This design balances hospitality elegance with functional efficiency, creating trust through visual polish while maintaining utility for booking operations.