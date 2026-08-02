# KTP Premium v1 Design Specification

Status: LOCKED

Version: 1.0

Component:
KtpCard

Reference:
docs/design-system/ktp-premium-v1.png

---

# SECTION 1

## DESIGN AUTHORITY

This specification defines the ONLY valid implementation of the official
TernakHub Digital Livestock Identity Card.

The PNG file

docs/design-system/ktp-premium-v1.png

is the MASTER DESIGN.

This markdown exists ONLY to explain how the PNG must be implemented.

If implementation differs from PNG,
implementation is WRONG.

PNG ALWAYS WINS.

---

## IMPLEMENTATION GOAL

Render the PNG into React.

NOT redesign.

NOT approximation.

NOT improvement.

NOT modernization.

NOT responsive redesign.

NOT another card.

The rendered component must visually appear as the PNG.

---

## IMPLEMENTATION TYPE

The KTP is ONE reusable component.

Component Name

KtpCard

Used by

• Livestock Profile Preview

• Fullscreen Viewer

• PDF

• Share

No duplicated component.

No Preview version.

No PDF version.

No Share version.

Only rendering scale changes.

Layout NEVER changes.

---

# CANVAS

Orientation

Landscape.

Canvas Ratio

Must remain identical to PNG.

Canvas Shape

Rounded rectangle.

No skew.

No transform.

No rotation.

Canvas Width

Reference driven.

Canvas Height

Reference driven.

Never stretch.

Never compress.

---

# SAFE AREA

Outer padding identical to PNG.

Top safe area identical.

Bottom safe area identical.

Left safe area identical.

Right safe area identical.

Nothing may overflow.

Nothing may clip.

---

# OUTER FRAME

One continuous card.

Single outer border.

No nested card.

No floating card.

No detached section.

No elevation redesign.

Entire KTP behaves as one physical card.

---

# BORDER

Border Type

Solid.

Border Thickness

Identical to PNG.

Border Color

Official TernakHub Navy.

Border Radius

Identical to PNG.

No double border.

No shadow border.

No glow.

---

# BACKGROUND

Background Color

Follow PNG.

Background Texture

Follow PNG.

Texture Scale

Follow PNG.

Texture Position

Follow PNG.

Texture Opacity

Follow PNG.

Never regenerate paper texture using CSS.

Use official asset when required.

---

# HEADER

Header spans full card width.

Header begins at top border.

Header height identical to PNG.

Header background identical.

Header padding identical.

Header border identical.

No transparency.

No blur.

No glass effect.

No gradient.

---

# HEADER GRID

Header divided into

LEFT

CENTER

RIGHT

The three zones remain fixed.

No responsive stacking.

No responsive wrapping.

---

# HEADER LEFT

Contains

Official TernakHub Logo

TERNAKHUB

BETERNAK LEBIH MUDAH

Logo remains left aligned.

Text remains vertically centered.

Spacing identical.

Logo size identical.

Logo ratio identical.

---

# HEADER LOGO

Never replace.

Never resize independently.

Never recolor.

Never crop.

Maintain original ratio.

Always crisp.

---

# HEADER TITLE

Text

KTP TERNAK

Largest text inside header.

Centered.

Bold.

Uppercase.

Never wrap.

Never shrink.

Never truncate.

---

# HEADER SUBTITLE

Text

IDENTITAS RESMI TERNAK

Centered.

Uppercase.

Smaller than title.

Letter spacing follows PNG.

Line height follows PNG.

No typography changes.

---

# HEADER RIGHT

Contains

Security Badge

Shield Icon

DATA TERLINDUNGI

JANGAN DISALAHGUNAKAN

Right aligned.

Spacing locked.

No redesign.

No icon replacement.

No text modification.

---

END OF SECTION 1

---

# SECTION 2

## BODY CONTAINER

The body starts immediately below the Header.

No gap exists between Header and Body.

The body occupies the remaining canvas area until the Footer.

The body background follows the official card background.

No floating panels.

No nested cards.

No independent containers.

---

# BODY GRID

The body is divided into THREE vertical columns.

LEFT COLUMN

CENTER COLUMN

RIGHT COLUMN

The visual proportions MUST remain identical to
ktp-premium-v1.png.

Never stack.

Never wrap.

Never reorder.

Never resize independently.

---

# BODY ALIGNMENT

All three columns start from the same top alignment.

All three columns end before the footer.

Vertical alignment is locked.

Horizontal alignment is locked.

---

# LEFT COLUMN

Purpose

Visual Identity.

Contains ONLY

Main Photo

Photo Gallery

Photo Counter

Nothing else.

---

# MAIN PHOTO CONTAINER

Position

Top Left.

Immediately below body padding.

Left aligned.

Never centered.

Never right aligned.

Width follows PNG.

Height follows PNG.

Aspect ratio follows PNG.

Padding follows PNG.

Margin follows PNG.

---

# PHOTO FRAME

White background.

Thin border.

Border color follows PNG.

Corner radius follows PNG.

No shadow redesign.

No elevation.

No floating effect.

---

# MAIN PHOTO

Occupies entire photo frame.

object-fit

cover

object-position

center

Never distort.

Never stretch.

Never squeeze.

Always preserve image proportions.

Portrait photos

Center crop.

Landscape photos

Center crop.

Square photos

Center crop.

---

# MAIN PHOTO PRIORITY

Display order

1.

Official KTP Photo

2.

Identity Photo

3.

Latest Photo

4.

Achievement Photo

5.

Newest Gallery Photo

If all unavailable

Display official livestock placeholder.

Never broken image.

Never browser placeholder.

---

# PHOTO GALLERY

Located directly below Main Photo.

Gallery begins immediately below photo margin.

Gallery width identical to PNG.

Gallery height identical to PNG.

Gallery background identical.

Gallery border identical.

Gallery radius identical.

Gallery spacing identical.

---

# GALLERY LAYOUT

The gallery layout follows
ktp-premium-v1.png exactly.

Every thumbnail occupies identical dimensions.

Every thumbnail shares identical border.

Every thumbnail shares identical radius.

Every thumbnail shares identical spacing.

No redesign.

---

# THUMBNAIL SLOT 1

Gallery Photo.

Displays newest available photo.

Object Fit

Cover.

Centered crop.

---

# THUMBNAIL SLOT 2

Gallery Photo.

Displays second newest photo.

Same styling.

---

# THUMBNAIL SLOT 3

Gallery Photo.

Displays third newest photo.

Same styling.

---

# THUMBNAIL SLOT 4

Gallery Photo.

Displays fourth newest photo.

Same styling.

---

# THUMBNAIL SLOT 5

Gallery Photo.

Displays fifth newest photo.

Same styling.

---

# ACTION SLOT

Last slot.

Position identical to PNG.

Border identical.

Radius identical.

Dashed border identical.

Contains centered "+" icon.

No redesign.

No replacement.

No movement.

---

# THUMBNAIL IMAGE

Every thumbnail

object-fit

cover

object-position

center

Never distort.

Never stretch.

Never squeeze.

---

# EMPTY THUMBNAIL

If photo unavailable

Display official livestock placeholder.

Maintain identical border.

Maintain identical spacing.

Maintain identical dimensions.

---

# PHOTO COUNTER

Located below gallery.

Position identical to PNG.

Displays

<number> FOTO

Examples

0 FOTO

7 FOTO

18 FOTO

Uses dynamic gallery count.

Never hardcoded.

Typography identical.

Alignment identical.

Spacing identical.

---

# LEFT COLUMN RULE

Everything inside LEFT COLUMN

must remain visually identical to

docs/design-system/ktp-premium-v1.png

No redesign.

No approximation.

No alternate layout.

No responsive layout.

No component replacement.

---

END OF SECTION 2

---

# SECTION 3

# CENTER COLUMN

The Center Column contains the official livestock identity information.

This column is the primary information area.

Its position is LOCKED.

Its width is LOCKED.

Its spacing is LOCKED.

No redesign.

No responsive rearrangement.

No movement.

---

# COLUMN START

The column begins horizontally aligned
with the top edge of the Main Photo.

The top alignment MUST match the PNG.

Never offset.

Never vertically center.

---

# OFFICIAL LIVESTOCK ID

Located at the top of the column.

This is the most visually dominant text
inside the body.

Displayed as

Official Livestock ID

Example

DPR-25-06-000001

Never wrap.

Never truncate.

Never reduce font size.

Never scale independently.

Always left aligned.

---

# PRIMARY INFORMATION GRID

Located directly below Livestock ID.

Spacing from Livestock ID

Identical to PNG.

The grid contains FOUR cards.

Layout

2 Columns

2 Rows

Never change.

Never stack.

Never collapse.

Never reorder.

---

# CARD 1

Field

Tanggal Lahir

Label

Tanggal Lahir

Value

Live data

---

# CARD 2

Field

Estimasi Umur

Label

Estimasi Umur

Value

Calculated from Birth Date.

---

# CARD 3

Field

Bobot Lahir

Label

Bobot Lahir

Unit

kg

Always display unit.

---

# CARD 4

Field

Bobot Sekarang

Label

Bobot Sekarang

Unit

kg

Always display unit.

---

# INFORMATION CARD STYLE

Background

White.

Border

Thin.

Border Color

Same as PNG.

Corner Radius

Same as PNG.

Internal Padding

Same as PNG.

No elevation.

No glow.

No shadow redesign.

---

# CARD LABEL

Typography identical to PNG.

Uppercase.

Medium Weight.

Dark Gray.

Never wrap.

---

# CARD VALUE

Typography identical to PNG.

Bold.

Dark Navy.

Single line.

Never wrap.

Never truncate.

---

# SECONDARY INFORMATION

Located below the information grid.

Rows are vertically stacked.

Every row contains

Icon

Label

Value

The icon alignment is LOCKED.

The text alignment is LOCKED.

Spacing between rows follows PNG.

---

# DISPLAY ORDER

The order is FIXED.

1

Breed

2

Sex

3

Farm

4

Current Location

5

Status

No additional fields.

No missing fields.

No reordering.

---

# BREED

Display breed exactly as stored.

Examples

Dorper

Texel

Compass Agrinak

Never abbreviate.

---

# SEX

Allowed values

Jantan

Betina

No icons.

No abbreviations.

---

# FARM

Display current owner/farm.

Allow two lines only if necessary.

Never truncate.

---

# CURRENT LOCATION

Display current active location.

Examples

Kandang A

Blok B

Padang Penggembalaan

Use live data.

---

# STATUS

Status is displayed as
a rounded badge.

Badge position

Identical to PNG.

Badge size

Identical to PNG.

Badge padding

Identical to PNG.

Badge radius

Identical to PNG.

---

# STATUS COLOR

Aktif

Official Green.

Dalam Perawatan

Official Blue.

Karantina

Official Orange.

Arsip

Official Gray.

Mati

Official Red.

No custom colors.

No gradients.

---

# DATA SOURCE

Every field MUST come from
existing livestock data.

Never duplicate data.

Never generate values.

Never create placeholders.

If data is unavailable

Display

Belum diisi

Never display

-

N/A

Unknown

null

undefined

Placeholder

---

# CENTER COLUMN RULE

Everything inside the Center Column

must visually match

docs/design-system/ktp-premium-v1.png

No redesign.

No approximation.

No responsive redesign.

No alternate layout.

---

END OF SECTION 3

---

# SECTION 4

# RIGHT COLUMN

The Right Column contains verification and supplementary identity information.

This section is LOCKED.

Its layout MUST remain visually identical to:

docs/design-system/ktp-premium-v1.png

No redesign.

No responsive layout.

No movement.

No resizing.

---

# COLUMN POSITION

Starts aligned with the top of the Center Column.

Ends immediately before Footer.

Vertical alignment is LOCKED.

Horizontal alignment is LOCKED.

---

# QR SECTION

Located at the top-right.

Position identical to PNG.

No offset.

No floating.

No centering changes.

---

# QR CONTAINER

Background

White.

Border

1px solid.

Border Color identical to PNG.

Corner Radius identical.

Padding identical.

Margin identical.

No shadow redesign.

No elevation.

---

# QR IMAGE

Generated dynamically.

Always square.

Always centered.

Never stretch.

Never rotate.

Never recolor.

No decorative border.

No rounded QR.

Maintain official quiet zone.

---

# QR CONTENT

Contains verification URL.

Must encode official livestock verification endpoint.

Never encode placeholder URL.

Never encode localhost.

Never encode temporary development URL.

Always use production verification format.

---

# QR LABEL

Located immediately below QR.

Text

SCAN UNTUK
VERIFIKASI

Uppercase.

Centered.

Typography identical to PNG.

Spacing identical.

Letter spacing identical.

Line height identical.

---

# QR BEHAVIOUR

QR must remain readable after:

Preview

Fullscreen

PDF

Share

Minimum scan success:

Production quality.

---

# ADDITIONAL INFORMATION PANEL

Located directly below QR.

Position identical.

Width identical.

Height identical.

Padding identical.

Margin identical.

Radius identical.

Border identical.

Background identical.

---

# PANEL HEADER

Title

INFORMASI TAMBAHAN

Uppercase.

Bold.

Dark Navy.

Alignment identical.

No redesign.

---

# PANEL BODY

Contains EXACTLY six rows.

Never add rows.

Never remove rows.

Never reorder rows.

---

# ROW ORDER

1

Tanggal Masuk

2

Asal

3

Warna

4

Ciri Khusus

5

Dibuat Pada

6

Terakhir Diperbarui

Order is LOCKED.

---

# ROW STYLE

Each row contains

Label

Separator

Value

Rows separated by thin divider.

Divider thickness identical.

Divider color identical.

Divider spacing identical.

---

# LABEL

Medium Weight.

Dark Gray.

Single line.

Never wrap.

Never truncate.

---

# VALUE

Bold.

Dark Navy.

Allow wrapping only if absolutely necessary.

Never overflow.

---

# FIELD SOURCE

Tanggal Masuk

← Existing livestock data

Asal

← Existing livestock data

Warna

← Existing livestock data

Ciri Khusus

← Existing livestock data

Dibuat Pada

← Existing livestock data

Terakhir Diperbarui

← Existing livestock data

No duplicated storage.

No temporary mapping.

No dummy metadata.

---

# EMPTY VALUE

If field is empty

Display

Belum diisi

Never display

-

N/A

Unknown

null

undefined

Placeholder

Dummy

---

# WATERMARK

The watermark is an official security element.

Never remove.

Never replace.

Never redesign.

---

# WATERMARK POSITION

Centered inside body.

Behind all body content.

Above background texture.

Below every visible component.

Never overlap Header.

Never overlap Footer.

Never clipped.

---

# WATERMARK STYLE

Official TernakHub emblem.

Opacity identical to PNG.

Rotation identical.

Scale identical.

Color identical.

No blur.

No glow.

No transparency modification.

---

# LAYER ORDER

Top

Header

↓

Body Content

↓

QR

↓

Information Panel

↓

Watermark

↓

Background Texture

↓

Canvas

Layer order MUST remain fixed.

---

# RIGHT COLUMN RULE

Everything inside the Right Column
must visually match

docs/design-system/ktp-premium-v1.png

No redesign.

No approximation.

No responsive redesign.

No alternate implementation.

---

END OF SECTION 4

---

# SECTION 5

# FOOTER

The Footer is an inseparable part of the official
Livestock Identity Card.

The Footer begins immediately after the Body.

The Footer spans the FULL width of the card.

Never detach.

Never float.

Never redesign.

Never simplify.

Always match:

docs/design-system/ktp-premium-v1.png

---

# FOOTER POSITION

Starts exactly where shown in PNG.

Ends at the bottom border.

Height identical to PNG.

Top edge identical.

Bottom edge identical.

---

# FOOTER BACKGROUND

Background Color

Official TernakHub Navy.

Solid.

No transparency.

No opacity change.

No gradient.

No blur.

No glass effect.

No material redesign.

---

# FOOTER GRID

Footer divided into

LEFT

CENTER

RIGHT

The proportions remain identical
to PNG.

Never rearrange.

Never stack.

Never wrap.

---

# FOOTER LEFT

Contains

Official Security Shield

Legal Notice

Position identical.

Padding identical.

Spacing identical.

Alignment identical.

---

# SECURITY ICON

Use official icon only.

Do not substitute.

Do not recolor.

Do not resize independently.

Keep original proportions.

---

# LEGAL NOTICE

Display exactly as defined by TernakHub.

Never paraphrase.

Never shorten.

Never wrap differently.

Never change typography.

---

# FOOTER CENTER

Reserved.

Maintain identical spacing.

Do not insert logo.

Do not insert copyright.

Do not insert timestamp.

Do not insert UUID.

Remain visually identical.

---

# FOOTER RIGHT

Contains

VERIFIKASI ONLINE

Verification URL

Security Icon

Everything right aligned.

Spacing identical.

Typography identical.

---

# VERIFICATION URL

Uses production verification URL.

Never localhost.

Never development URL.

Never temporary URL.

Never placeholder.

---

# FOOTER TYPOGRAPHY

Must follow PNG.

Font Family

Identical.

Weight

Identical.

Letter Spacing

Identical.

Line Height

Identical.

Alignment

Identical.

Color

Identical.

---

# COLOR SYSTEM

Every visible color must match
ktp-premium-v1.png.

Never substitute.

Never auto-theme.

Never dark-mode adapt.

Never use framework defaults.

---

# PRIMARY BRAND COLOR

Used for

Header

Footer

Official Titles

Primary Border

Official Branding

Must remain identical.

---

# SECONDARY BRAND COLOR

Used for

Icons

Secondary Text

Badge Elements

Must remain identical.

---

# CREAM BACKGROUND

Body background.

Texture identical.

Brightness identical.

Contrast identical.

Opacity identical.

---

# BORDER SYSTEM

Every border remains identical.

Thickness identical.

Radius identical.

Opacity identical.

Color identical.

No border removal.

No border enhancement.

---

# SHADOW SYSTEM

Shadow follows PNG.

No stronger shadow.

No weaker shadow.

No elevation redesign.

No floating effect.

---

# SPACING SYSTEM

Horizontal spacing

Locked.

Vertical spacing

Locked.

Internal padding

Locked.

External margin

Locked.

Gap between components

Locked.

No optimization.

---

# RENDERING RULE

The SAME component renders

Profile Preview

↓

Fullscreen

↓

PDF

↓

Share

No alternative implementation.

No PDF layout.

No Preview layout.

No Share layout.

Only rendering scale changes.

---

# SCALING RULE

Desktop

100%

Tablet

Scale only.

Phone

Scale only.

Never rearrange.

Never collapse columns.

Never move QR.

Never move footer.

Never move watermark.

Never move gallery.

Never move information panel.

---

# PERFORMANCE

The KTP must render using the same
DOM hierarchy regardless of scale.

No duplicated rendering tree.

No duplicated layout.

No duplicated styles.

---

# IMPLEMENTATION VALIDATION

Implementation is accepted ONLY IF

Header matches PNG.

Body matches PNG.

Gallery matches PNG.

Center Column matches PNG.

Right Column matches PNG.

QR matches PNG.

Information Panel matches PNG.

Watermark matches PNG.

Footer matches PNG.

Typography matches PNG.

Borders match PNG.

Spacing matches PNG.

Padding matches PNG.

Radius matches PNG.

Shadow matches PNG.

Background matches PNG.

Texture matches PNG.

Logo matches PNG.

Security Badge matches PNG.

Photo Frame matches PNG.

Photo Counter matches PNG.

Thumbnail Strip matches PNG.

Verification URL matches PNG.

---

# FINAL RULE

The PNG is the MASTER DESIGN.

This markdown is the IMPLEMENTATION CONTRACT.

Any visual difference from
docs/design-system/ktp-premium-v1.png

shall be considered

IMPLEMENTATION FAILURE.

No redesign is permitted.

No approximation is permitted.

End of Design Specification.

