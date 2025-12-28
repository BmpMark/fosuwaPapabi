# Hotel & Restaurant Management System - Design Guidelines

## Design Approach
**Reference**: Airbnb's welcoming aesthetic for guest areas + Linear's clean efficiency for management interfaces. This dual-personality approach creates trust for guests while maintaining operational clarity for staff.

## Typography System
- **Headings**: Inter (600-700 weight) for clarity and professionalism
- **Body**: Inter (400-500 weight) for optimal readability
- **Hierarchy**: 
  - Page Titles: text-4xl lg:text-5xl
  - Section Headers: text-2xl lg:text-3xl
  - Card Titles: text-xl
  - Body: text-base
  - Captions: text-sm

## Layout & Spacing
**Core Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Container max-width: max-w-7xl for main content
- Section padding: py-16 lg:py-24
- Card padding: p-6 lg:p-8
- Form spacing: space-y-6
- Grid gaps: gap-6 lg:gap-8

## Registration Form Design

**Layout Structure**:
- **Split-screen design** on desktop (lg: grid-cols-2)
- Left panel: Large hero image (60% width) with property showcase
- Right panel: Registration form (40% width, sticky on scroll)
- Mobile: Stack to single column, hero image 40vh, form below

**Hero Image Section**:
- Full-height background image of hotel lobby/restaurant
- Subtle dark gradient overlay (from transparent to black/10 opacity) for text readability
- Overlay text: Hotel/restaurant name + tagline positioned bottom-left with generous padding (p-8)
- Use blurred-background badge showing "Trusted by 10,000+ guests" in top-right corner

**Form Container**:
- Centered vertically with max-w-md
- White background with subtle shadow (shadow-xl)
- Rounded corners: rounded-2xl
- Padding: p-8 lg:p-10

**Form Elements**:
1. **Header Section**:
   - Logo/brand mark centered at top
   - "Create Account" heading (text-3xl font-semibold)
   - Subheading: "Join our hospitality family" (text-gray-600)
   - Spacing: mb-8

2. **Role Selection Dropdown** (Primary Feature):
   - Label: "I am registering as" (font-medium mb-2)
   - Custom select with chevron icon
   - Large touch target: py-3 px-4
   - Options: Guest, Staff, Manager
   - Border: 2px solid with focus ring
   - Rounded: rounded-lg

3. **Input Fields**:
   - Full name, email, phone number, password
   - Floating labels or top-aligned labels
   - Height: py-3
   - Border: 2px solid
   - Focus state: ring with brand color
   - Password strength indicator below field

4. **Additional Fields by Role**:
   - Guest: Preferences (business/leisure toggle)
   - Staff: Department selection, Employee ID
   - Manager: Property/location assignment

5. **Submit Button**:
   - Full width button
   - Height: py-4
   - Font: font-semibold text-lg
   - Prominent placement with mb-6

6. **Footer**:
   - "Already have an account? Sign in" link
   - Social registration options (Google, Apple) with divider
   - Terms acceptance checkbox

**Validation States**:
- Error: Red border with shake animation, error text below field
- Success: Green checkmark icon inside field
- Loading: Spinner in button, disabled state

## Core Components Library

**Navigation** (Guest/Public):
- Horizontal navbar with logo left, navigation center, "Sign In" + "Register" buttons right
- Sticky on scroll with subtle shadow
- Mobile: Hamburger menu

**Cards** (Room/Menu Items):
- Image at top (16:9 aspect ratio)
- Padding: p-6
- Border: 1px with hover shadow elevation
- Rounded: rounded-xl

**Buttons**:
- Primary: Solid background, white text, py-3 px-6
- Secondary: Outlined with 2px border
- Ghost: Text only with hover background
- Icon buttons: Square with rounded-lg

**Data Tables** (Staff/Manager):
- Striped rows
- Sticky header
- Action buttons right-aligned
- Responsive: Cards on mobile

## Images

1. **Registration Hero**: Professional hotel lobby shot with natural lighting - warm, inviting, showing reception desk and modern interior design. Aspect ratio 9:16 (portrait) for desktop split-screen.

2. **Dashboard Backgrounds** (if used): Subtle pattern or texture, never competing with data. Consider abstract geometric shapes in brand colors at 5% opacity.

## Accessibility
- ARIA labels on all form inputs
- Keyboard navigation for role dropdown
- Focus indicators on all interactive elements
- Error announcements for screen readers
- Color contrast ratio minimum 4.5:1 for text

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked)
- Tablet: 768px-1024px (adjusted spacing)
- Desktop: > 1024px (full split-screen)

**Key Principle**: The registration form is the gateway - make it trustworthy, effortless, and visually aligned with hospitality excellence.