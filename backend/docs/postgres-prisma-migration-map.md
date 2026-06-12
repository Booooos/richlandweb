# PostgreSQL / Prisma Migration Map

This document maps the current JSON-backed prototype into the first PostgreSQL / Prisma target structure.

The goal is to preserve the current business flow:

`Inquiry → Quotation → PI → Customer PO → Order Execution → Production / Shipping / Export Docs`

## Current JSON store arrays

- `customers`
- `contacts`
- `inquiries`
- `jobContacts`
- `quotations`
- `sampleRequests`
- `proformaInvoices`
- `customerPOs`
- `orders`
- `productionTasks`
- `shippingPlans`
- `exportDocumentPacks`
- `uploads`
- `files`
- `messages`
- `timeline`

## Suggested Prisma models

### Customer
- `id`
- `companyName`
- `primaryEmail`
- `website`
- `destinationMarket`
- `createdAt`
- `updatedAt`

Relations:
- contacts
- inquiries
- quotations
- proformaInvoices
- customerPOs
- orders
- uploads
- files

### Contact
- `id`
- `customerId`
- `name`
- `email`
- `phone`
- `createdAt`
- `updatedAt`

### Inquiry
- `id`
- `customerId`
- `contactId`
- `source`
- `status`
- `targetCategory`
- `estimatedQuantity`
- `destinationMarket`
- `cooperationMode`
- `message`
- `createdAt`
- `updatedAt`

### Quotation
- `id`
- `inquiryId`
- `customerId`
- `version`
- `currency`
- `validUntil`
- `moq`
- `leadTime`
- `incoterm`
- `notes`
- `status`
- `salesOwner`
- `portalToken`
- `createdAt`
- `updatedAt`

### QuotationItem
- `id`
- `quotationId`
- `model`
- `quantity`
- `price`
- `name`
- `sku`

### ProformaInvoice
- `id`
- `quotationId`
- `customerId`
- `quotationVersion`
- `paymentTerms`
- `tradeTerms`
- `notes`
- `status`
- `portalToken`
- `createdAt`
- `updatedAt`

### CustomerPO
- `id`
- `customerId`
- `quotationId`
- `piId`
- `orderId`
- `poNumber`
- `version`
- `status`
- `quantitySummary`
- `packagingNotes`
- `priceNotes`
- `leadTimeNotes`
- `tradeTerms`
- `note`
- `source`
- `createdAt`
- `updatedAt`

### CustomerPOAttachment
- `id`
- `customerPoId`
- `name`
- `url`

### Order
- `id`
- `customerId`
- `quotationId`
- `piId`
- `customerPoId`
- `status`
- `customerVisibleStatus`
- `productionStatus`
- `docsStatus`
- `portalToken`
- `createdAt`
- `updatedAt`

### ProductionTask
- `id`
- `orderId`
- `customerId`
- `status`
- `workshop`
- `quantitySummary`
- `packagingNotes`
- `plannedStartDate`
- `plannedFinishDate`
- `notes`
- `createdAt`
- `updatedAt`

### ShippingPlan
- `id`
- `orderId`
- `customerId`
- `status`
- `tradeTerms`
- `portOfLoading`
- `shipmentWindow`
- `bookingReference`
- `packagingConfirmed`
- `marksConfirmed`
- `notes`
- `createdAt`
- `updatedAt`

### ExportDocumentPack
- `id`
- `orderId`
- `customerId`
- `status`
- `packagingConfirmed`
- `notes`
- `createdAt`
- `updatedAt`

### ExportDocumentRequirement
- `id`
- `exportDocumentPackId`
- `name`
- `prepared`

### Upload
- `id`
- `customerId` nullable
- `originalName`
- `storedName`
- `mimeType`
- `size`
- `localPath` or `storageKey`
- `publicPath`
- `createdAt`

### FileRecord
- `id`
- `orderId`
- `customerId`
- `uploadId` nullable
- `kind`
- `name`
- `url`
- `visibility`
- `createdAt`

### Message
- `id`
- `customerId`
- `quotationId` nullable
- `orderId` nullable
- `channel`
- `authorRole`
- `message`
- `createdAt`

### MessageAttachment
- `id`
- `messageId`
- `name`
- `url`

### TimelineEvent
- `id`
- `entityType`
- `entityId`
- `visibility`
- `type`
- `message`
- `createdAt`

## Migration notes

### 1. Preserve portal tokens
- `portalToken` is already central to customer-side access
- Keep it during migration

### 2. Normalize nested arrays
- `quotation.items`
- `customerPO.attachments`
- `exportDocumentPack.requiredDocuments`
- `exportDocumentPack.preparedDocuments`

These should become relational child tables in Prisma.

### 3. Keep status enums explicit
- `Order.status`
- `CustomerPO.status`
- `ExportDocumentPack.status`
- `ProductionTask.status`
- `ShippingPlan.status`

Do not leave them as free text in the database migration.

### 4. Add auth tables later
Auth is not in the prototype yet.
When introduced, add:
- `User`
- `RoleAssignment`
- `CustomerPortalAccess`

## Recommended migration order

1. Create Prisma schema for the current business objects
2. Add database-backed repositories while keeping existing route shapes
3. Migrate JSON sample data into PostgreSQL
4. Switch read paths first
5. Switch write paths
6. Remove JSON store after parity is proven
