-- تفريغ قاعدة بيانات منصة مراسي (مخطط + بيانات)
-- المصدر: db/custom.db — يُولّد عبر: bun scripts/db-dump.ts
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'STAFF',
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "doneAt" DATETIME,
    CONSTRAINT "ChecklistItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "amountBase" REAL NOT NULL DEFAULT 0,
    "isOfficeFee" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostItem_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CostItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "taxNumber" TEXT,
    "crNumber" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "passwordHash" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExchangeRate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "HSCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "unit" TEXT,
    "dutyRate" REAL NOT NULL DEFAULT 0,
    "salesTaxRate" REAL NOT NULL DEFAULT 0,
    "otherTaxRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "planId" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "activatedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "License_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "License_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "requestId" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageLog_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "customerId" TEXT,
    "userId" TEXT,
    "requestId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationTemplate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Office" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoPath" TEXT,
    "activityType" TEXT NOT NULL DEFAULT 'BOTH',
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "managerName" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#0F766E',
    "workingHours" TEXT,
    "about" TEXT,
    "holidays" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reqCounter" INTEGER NOT NULL DEFAULT 0,
    "storageUsedMb" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "officeId" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "amountBase" REAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "note" TEXT,
    "attachmentPath" TEXT,
    "receivedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStorageMb" INTEGER NOT NULL DEFAULT 2048,
    "maxMonthlyReqs" INTEGER NOT NULL DEFAULT 100,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "priceMonthly" REAL NOT NULL DEFAULT 0,
    "priceYearly" REAL NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "RegulatoryStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "result" TEXT,
    "notes" TEXT,
    "attachmentPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegulatoryStep_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStageId" TEXT,
    "trackingCode" TEXT NOT NULL,
    "formData" TEXT,
    "estimatedDays" INTEGER,
    "acceptedAt" DATETIME,
    "expectedCompletion" DATETIME,
    "completedAt" DATETIME,
    "deliveredAt" DATETIME,
    "rejectedReason" TEXT,
    "missingDeadline" DATETIME,
    "completionNotified" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "rating" INTEGER,
    "assignedToId" TEXT,
    "createdByStaffId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Request_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Request_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "RequestDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "requiredDocId" TEXT,
    "name" TEXT NOT NULL,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "reviewNote" TEXT,
    "uploadedByType" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "uploadedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RequestDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "stageId" TEXT,
    "stageName" TEXT,
    "note" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "attachmentPath" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'STAFF',
    "actorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "price" REAL,
    "priceLabel" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "estimatedDays" INTEGER NOT NULL DEFAULT 7,
    "isClearance" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceCategory_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ServiceRequiredDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "allowedFormats" TEXT NOT NULL DEFAULT 'PDF,JPG,PNG',
    "maxSizeMb" INTEGER NOT NULL DEFAULT 10,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceRequiredDocument_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ServiceStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "notifyClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceStage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "billOfLadingNo" TEXT,
    "containerNos" TEXT,
    "containerType" TEXT,
    "supplierName" TEXT,
    "importerName" TEXT,
    "originCountry" TEXT,
    "arrivalPort" TEXT,
    "carrier" TEXT,
    "arrivalDate" DATETIME,
    "declarationNo" TEXT,
    "goodsType" TEXT,
    "weight" REAL,
    "packagesCount" INTEGER,
    "value" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "releasePermitNo" TEXT,
    "releasePermitAt" DATETIME,
    "releasePermitPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shipment_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCodeId" TEXT,
    "hsCodeText" TEXT,
    "originCountry" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "weight" REAL,
    "value" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dutyRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShipmentItem_hsCodeId_fkey" FOREIGN KEY ("hsCodeId") REFERENCES "HSCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT NOT NULL,
    "requestId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "dueAt" DATETIME,
    "assigneeId" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officeId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_officeId_createdAt_idx" ON "AuditLog"("officeId", "createdAt");
CREATE INDEX "Customer_officeId_email_idx" ON "Customer"("officeId", "email");
CREATE INDEX "Customer_officeId_phone_idx" ON "Customer"("officeId", "phone");
CREATE UNIQUE INDEX "ExchangeRate_officeId_currency_key" ON "ExchangeRate"("officeId", "currency");
CREATE UNIQUE INDEX "HSCode_code_key" ON "HSCode"("code");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "License_key_key" ON "License"("key");
CREATE UNIQUE INDEX "NotificationTemplate_officeId_event_channel_key" ON "NotificationTemplate"("officeId", "event", "channel");
CREATE INDEX "Notification_officeId_recipientType_customerId_idx" ON "Notification"("officeId", "recipientType", "customerId");
CREATE INDEX "Notification_officeId_recipientType_userId_idx" ON "Notification"("officeId", "recipientType", "userId");
CREATE UNIQUE INDEX "Office_slug_key" ON "Office"("slug");
CREATE INDEX "PasswordReset_accountType_accountId_createdAt_idx" ON "PasswordReset"("accountType", "accountId", "createdAt");
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");
CREATE INDEX "RequestDocument_requestId_name_idx" ON "RequestDocument"("requestId", "name");
CREATE UNIQUE INDEX "Request_requestNumber_key" ON "Request"("requestNumber");
CREATE UNIQUE INDEX "Request_trackingCode_key" ON "Request"("trackingCode");
CREATE UNIQUE INDEX "Shipment_requestId_key" ON "Shipment"("requestId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvmxrs0001qdpg2e967854', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1792875256696);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvogds0003qdpguj80uten', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1792875327472);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvv6aj000qqdpgqahacarv', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'CREATE', 'Request', 'cmvmvv5rd0005qdpgz780bmxf', '{"requestNumber":"REDS-2026-0006","draft":false}', 1792875640988);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvwtli000uqdpgoq5whz7n', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'STATUS_CHANGE', 'Request', 'cmvmvv5rd0005qdpgz780bmxf', '{"from":"SUBMITTED","to":"ACCEPTED","decision":"ACCEPTED"}', 1792875717846);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvyvl20014qdpgxyv6u01s', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'STATUS_CHANGE', 'Request', 'cmvmvv5rd0005qdpgz780bmxf', '{"stage":"قيد التدقيق المستندي","to":"STAGE"}', 1792875813734);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmvzsom0016qdpgn12q9hnf', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792875856631);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw07pg001fqdpgf8f2qyfx', 'cmvmw07pb0017qdpg10ffanv7', 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'CREATE', 'Office', 'cmvmw07pb0017qdpg10ffanv7', '{"name":"مكتب عدن التجاري للتخليص","slug":"aden-trade","licenseKey":"MRX-TYYA-T9PT-FCXU","plan":"الأساسية"}', 1792875876101);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw27xn003lqdpgj7we2vdn', 'cmvmw07pb0017qdpg10ffanv7', 'STAFF', NULL, 'محمد الشميري', 'LICENSE', 'Office', 'cmvmw07pb0017qdpg10ffanv7', '{"key":"MRX-TYYA-T9PT-FCXU","activated":true}', 1792875969707);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw4sg00001qd9wg7phqq0a', 'cmvmw07pb0017qdpg10ffanv7', 'STAFF', 'cmvmw27wt002jqdpgwrb0rdyo', 'محمد الشميري', 'LOGOUT', 'USER', 'cmvmw27wt002jqdpgwrb0rdyo', NULL, 1792876089600);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw51g10003qd9wifig68q1', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'LOGIN', 'USER', 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1792876101266);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw5p4c000hqd9w9nwlq83n', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'STATUS_CHANGE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"from":"AWAITING_CLIENT","to":"AWAITING_CLIENT","decision":"MISSING"}', 1792876131948);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw5xwi000jqd9w6r970ieh', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'LOGOUT', 'USER', 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1792876143330);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw6f1u000lqd9wq8zd9ikl', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', 'محمد سالم باعوم', 'LOGIN', 'Customer', 'cmvmtjybi0064qdb7a5mn43o0', NULL, 1792876165555);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvmw7yrj000wqd9wbotvmgnf', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', 'محمد سالم باعوم', 'UPLOAD', 'RequestDocument', 'cmvmtjyc60079qdb7chtfplmj', '{"name":"الفاتورة التجارية","version":2}', 1792876237759);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5cboi0001rio1piescr93', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792952023843);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5d0510003rio1lnaujs7p', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792952055541);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5i2t50005rio1vmdi04xo', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792952292281);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5tew00007rio1en15nfe7', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy8e001qqdb7fhtfhegf', 'فاطمة المحاسب', 'LOGIN', 'USER', 'cmvmtjy8e001qqdb7fhtfhegf', NULL, 1792952821152);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5xfzj0009rio1beekw3r8', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1792953009199);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo5ylvm000brio1inrfdouy', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy6e001oqdb7xeiqpxqf', 'علي المخلص', 'LOGIN', 'USER', 'cmvmtjy6e001oqdb7xeiqpxqf', NULL, 1792953063491);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo649aq000frio1gfkxdtow', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvo649ap000drio1ru74ugxe', 'شركة المبزي للتجارة و الاستيراد', 'CREATE', 'Customer', 'cmvo649ap000drio1ru74ugxe', '{"registered":true}', 1792953327123);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo6c8q70012rio1d3dqrehm', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvo649ap000drio1ru74ugxe', 'شركة المبزي للتجارة و الاستيراد', 'CREATE', 'Request', 'cmvo6c8pi000hrio13huh64v2', '{"requestNumber":"REDS-2026-0007","draft":false}', 1792953699632);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo6cnbn0014rio1h72mjvsa', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', NULL, 'شركة المبزي للتجارة و الاستيراد', 'VIEW_FILE', 'FILE', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvo6c8pi000hrio13huh64v2/36f0ed3748430b7a8a66250e.png', '{"via":"api"}', 1792953718547);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo6s86t0016rio10kmjrxx4', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792954445429);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo72ujs0018rio1lqs7y98n', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792954940968);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo7cyj00001ric7xyjq485h', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792955412684);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo7etqq000cric7noh4fa63', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792955499794);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo7kxuu000eric70wtzxzkf', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792955785062);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo8aq8o0001rix3ofb5lai5', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792956988249);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo8bluo0003rix3x14zo7zm', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792957029216);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo8ukxw000erix3u4ckjw7t', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792957914500);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo8wh70000nrix3ww36lcua', 'cmvo8wh6w000frix3hjatqzed', 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'CREATE', 'Office', 'cmvo8wh6w000frix3hjatqzed', '{"name":"بن خليل للسفريات و السياحة و  الخدمات اللوجستية","slug":"benkalal-com","licenseKey":"MRX-NRUN-Y87B-DNS7","plan":"الأعمال"}', 1792958002957);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo91qkt001rrix39qpkyss3', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', NULL, 'بن خليل', 'LICENSE', 'Office', 'cmvo8wh6w000frix3hjatqzed', '{"key":"MRX-NRUN-Y87B-DNS7","activated":true}', 1792958248397);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9n6z0001trix3jf8jz19w', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792959249421);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9nfcv001vrix31wwy9sfb', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792959260287);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9nvxv001xrix343z7b07h', 'cmvo8wh6w000frix3hjatqzed', 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'IMPERSONATE', 'Office', 'cmvo8wh6w000frix3hjatqzed', '{"target":"بن خليل"}', 1792959281780);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9oihu002frix3me4tvn5q', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvo9oihs0021rix31f9yw3vm', '{"fromTemplate":"تذاكر طيران دولية"}', 1792959311010);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9os2j002zrix3xgkys83m', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvo9os2h002jrix3t9321igt', '{"fromTemplate":"حزمة العمرة"}', 1792959323420);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9oyg7003frix3eocji50u', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvo9oyg50031rix3mnwcejc5', '{"fromTemplate":"حجز فنادق"}', 1792959331688);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvo9pajp003zrix31xmaymrw', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvo9pajn003jrix32lkga7ai', '{"fromTemplate":"تأشيرة سياحية"}', 1792959347366);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoamb9u004mrix3bngpyxso', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792960887955);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoamo2o004orix3ux3opcqe', 'cmvo8wh6w000frix3hjatqzed', 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'IMPERSONATE', 'Office', 'cmvo8wh6w000frix3hjatqzed', '{"target":"بن خليل"}', 1792960904544);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoan6g8004srix3i505lem2', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvoan6g5004qrix3j8vxtkke', '{"name":"نقل بري وتوصيل المطار"}', 1792960928360);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoao4ts004wrix375tjmh6y', 'cmvo8wh6w000frix3hjatqzed', 'CUSTOMER', 'cmvoao4tq004urix39yz6h0xh', 'عميل اختبار مراسي', 'CREATE', 'Customer', 'cmvoao4tq004urix39yz6h0xh', '{"registered":true}', 1792960972912);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoayd94005frix3iiv0myo1', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792961450392);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvoayiw3005hrix3uao15cfd', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792961457699);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvob036q005jrix31ml7aj6g', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792961530659);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvob0jvs005lrix30jb0hu4u', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1792961552297);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvob0osj005nrix3a4qzjmas', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGOUT', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1792961558659);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvob17o7005prix325e1sf1k', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1792961583128);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvobalry005trix36qkpyto3', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'Service', 'cmvobalrx005rrix33kwm7opd', '{"name":"تجديد ب"}', 1792962021311);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvobefe1005vrix3gjwzxj7e', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGOUT', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1792962199657);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvobephb005xrix3dr6xukz5', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1792962212736);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvobnehb0001riyxdevnunwb', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1792962618384);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqwrrr30001ptuykzq3h0jt', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793119026495);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqwsl2i0003ptuy8dc31h2c', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793119064490);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqwvhxe0005ptuy884id89m', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793119200387);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqx00gr0007ptuy1m228xnw', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793119411035);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqx0w130009ptuy5k7vorqq', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793119451944);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqxlvfq000bptuy74fqexpp', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793120430950);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqy406y000gptuykrmdv931', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"assignedTo":"cmvmtjy2e001kqdb77c81dk3h"}', 1793121276922);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqy45vv000lptuywbyyqwwt', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"assignedTo":"cmvmtjy4e001mqdb7wckj46o8"}', 1793121284299);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqy4wgi000vptuysrslluqc', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'STATUS_CHANGE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"from":"UNDER_REVIEW","to":"ACCEPTED","decision":"ACCEPTED"}', 1793121318738);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqy5oys0015ptuy568dos1t', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'STATUS_CHANGE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"stage":"فتح البيان الجمركي","to":"STAGE"}', 1793121355684);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqy5psw001fptuy21n1ulfj', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'STATUS_CHANGE', 'Request', 'cmvmtjyc60079qdb7chtfplmj', '{"stage":"فتح البيان الجمركي","to":"STAGE"}', 1793121356768);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqygf0o0026ptuydeioruiq', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'CREATE', 'Service', 'cmvqygf0m001jptuy9najc16n', '{"fromTemplate":"تخليص حاوية 40 قدم"}', 1793121856008);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqymwjn002aptuyh7m522zr', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'PAYMENT', 'Payment', 'cmvqymwjl0028ptuyz3m4qq0g', '{"amount":8000,"currency":"SAR","customerId":"cmvo649ap000drio1ru74ugxe","requestId":null}', 1793122158659);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqypos8002cptuyr2u67wsr', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGIN', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1793122288569);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqz086y002gptuy7iz2lcg4', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'CREATE', 'User', 'cmvqz086x002eptuyfxyra3al', '{"name":"علي احمد","role":"BROKER"}', 1793122780283);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqz28la002iptuyeddv65j5', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793122874110);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqz3n7q002kptuyu9m8swos', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793122939718);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqz3v5g002mptuyrcq4npud', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793122950005);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqz9gua002qptuyiox4latb', 'cmvo8wh6w000frix3hjatqzed', 'CUSTOMER', 'cmvqz9gu8002optuyawowni9a', 'العمدة للاستيراد', 'CREATE', 'Customer', 'cmvqz9gu8002optuyawowni9a', '{"registered":true}', 1793123211395);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvqzmwi4002sptuy1r5a4jz7', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793123838220);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr0b3pt002uptuyk1u1bij1', 'cmvmw07pb0017qdpg10ffanv7', 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LICENSE', 'License', 'cmvmw07pc0019qdpgaze8kk0e', '{"action":"renew","extra":365}', 1793124967313);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr0ftc6002wptuy2wzexfw4', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'Plan', 'cmvmtjxz50003qdb7u0m885xj', '{"name":"الأعمال","description":"للمكاتب الكبيرة متعددة الفروع","maxUsers":100,"maxStorageMb":20480,"maxMonthlyReqs":2000,"whatsappEnabled":true,"priceMonthly":150,"priceYearly":1500}', 1793125187142);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr0g1fl002yptuyyz32hghk', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'Plan', 'cmvmtjxz50003qdb7u0m885xj', '{"name":"الأعمال","description":"للمكاتب الكبيرة متعددة الفروع","maxUsers":100,"maxStorageMb":20480,"maxMonthlyReqs":2000,"whatsappEnabled":true,"priceMonthly":200,"priceYearly":1500}', 1793125197634);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr0gd5p0030ptuyktq73uxc', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'Plan', 'cmvmtjxz50003qdb7u0m885xj', '{"name":"الأعمال","description":"للمكاتب الكبيرة متعددة الفروع","maxUsers":100,"maxStorageMb":20480,"maxMonthlyReqs":2000,"whatsappEnabled":true,"priceMonthly":250,"priceYearly":1500}', 1793125212829);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr0ndwz0032ptuyb42y7rjt', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'Plan', 'cmvmtjxz50003qdb7u0m885xj', '{"name":"الأعمال","description":"للمكاتب الكبيرة متعددة الفروع","maxUsers":100,"maxStorageMb":20480,"maxMonthlyReqs":2000,"whatsappEnabled":true,"priceMonthly":100000,"priceYearly":1500}', 1793125540403);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr10bv50034ptuyxgzqtpm3', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793126144273);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1clmw0036ptuy9qr6c3dn', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793126716808);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1gwtn0038ptuy70qinuxy', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"emailChanged":true,"from":"admin@marsaa.ye","to":"newadmin@marsaa.ye"}', 1793126917931);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1hagy003aptuyszk5yfc5', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"passwordChanged":true}', 1793126935618);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1hhyz003cptuyepk6ej9g', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793126945339);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1hp4e003eptuy6c1k1nvl', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793126954607);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1iic9003gptuyfawc90nm', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"emailChanged":true,"from":"newadmin@marsaa.ye","to":"admin@marsaa.ye"}', 1793126992473);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1isa1003iptuyjgb3i0ys', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"passwordChanged":true}', 1793127005353);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1j4gi003kptuy01j50cy2', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793127021139);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1j9s7003mptuy63xp2mp9', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793127028039);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1z76s0001pt6irq77dk3j', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793127771172);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr1zp290003pt6iiow8tlp3', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'User', 'cmvmtjy2e001kqdb77c81dk3h', '{"passwordChanged":true,"self":true}', 1793127794337);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr207aw0005pt6ikmzrxl7s', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGOUT', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793127817977);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr20glm0007pt6ix67liqd9', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793127830027);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr20r250009pt6imc3hh5c8', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'User', 'cmvmtjy2e001kqdb77c81dk3h', '{"emailChanged":true,"from":"admin@redsea-clearance.ye","to":"newadmin@redsea-clearance.ye","self":true}', 1793127843581);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr20w1x000bpt6i3mw192y6', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'User', 'cmvmtjy2e001kqdb77c81dk3h', '{"emailChanged":true,"from":"newadmin@redsea-clearance.ye","to":"admin@redsea-clearance.ye","self":true}', 1793127850054);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr210sc000dpt6idir0sycu', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGOUT', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793127856188);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr21zrb000fpt6ih2ofkens', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'LOGIN', 'USER', 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1793127901512);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr22d1j000hpt6it277odma', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'LOGOUT', 'USER', 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1793127918727);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr22kt4000jpt6igfoxf81q', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793127928792);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr2303j000lpt6i85yvrjbm', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'UPDATE', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"passwordChanged":true}', 1793127948607);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr23i6d000npt6imgl2k0di', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793127972037);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr23so3000ppt6i2jnuohng', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'UPDATE', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"contactChanged":true,"phoneChanged":true}', 1793127985635);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr245k3000rpt6i4jia7qz6', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793128002339);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr24md3000tpt6iu41sqywo', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'UPDATE', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"contactChanged":true,"phoneChanged":true}', 1793128024119);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr24rfc000vpt6i9y8z01wi', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'UPDATE', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"passwordChanged":true}', 1793128030681);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr254uo000xpt6i27evwgc3', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793128048081);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr26oo9000zpt6i16usteta', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'UPDATE', 'User', 'cmvmtjy2e001kqdb77c81dk3h', '{"passwordChanged":true,"self":true}', 1793128120426);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr26uy80011pt6in4kc15lj', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGOUT', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793128128560);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr271930013pt6ii1aor620', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793128136727);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr279v70015pt6iazj7ijc8', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGOUT', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793128147892);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr27gwi0017pt6ixhgrmzaj', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793128157010);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvr4iiuu0001pttxfnsz4mhu', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, '2026-10-27T20:13:51.991+00:00');
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvshsclq0001q1w0uj56z61j', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGIN', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1793214791630);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvshul510003q1w0hvj957q2', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGOUT', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1793214896005);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvshxn5o0005q1w0n06pnl5l', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGIN', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1793215038588);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvshy8z90007q1w0ag6hpr4w', 'cmvo8wh6w000frix3hjatqzed', 'STAFF', 'cmvo91qkb000prix3zxs93z2a', 'بن خليل', 'LOGOUT', 'USER', 'cmvo91qkb000prix3zxs93z2a', NULL, 1793215066869);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvshz6dm0009q1w0qp87d6hi', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGIN', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793215110154);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsi27kh000bq1w0wz4mvgew', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"emailChanged":true,"from":"admin@marsaa.ye","to":"hussin99q@gmail.com"}', 1793215251665);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsi2n1o000dq1w0yin329df', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'UPDATE', 'User', 'cmvmtjxyz0000qdb737e0me50', '{"passwordChanged":true}', 1793215271725);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsiq2a1000fq1w05iwk96b4', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793216364553);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsits2z000hq1w0tzajfsac', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793216537964);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsj8n8r000jq1w0c1mkozhl', NULL, 'SUPER_ADMIN', 'cmvmtjxyz0000qdb737e0me50', 'مدير منصة مراسي', 'LOGOUT', 'USER', 'cmvmtjxyz0000qdb737e0me50', NULL, 1793217231531);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsjdbfd000lq1w0lvnen1jr', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793217449497);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk0jkd0002q1w383vkw3x9', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'PASSWORD_RESET_REQUEST', 'User', 'cmvmtjy4e001mqdb7wckj46o8', '{"via":"sara@redsea-clearance.ye","codeHidden":false}', 1793218533134);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk2axj0004q1w3k900a8g9', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'PASSWORD_RESET', 'User', 'cmvmtjy4e001mqdb7wckj46o8', '{"via":"otp"}', 1793218615255);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk2mu00006q1w3uaf3kefv', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy4e001mqdb7wckj46o8', 'سارة حسن', 'LOGIN', 'USER', 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1793218630681);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk39fc000dq1w3o9pjf55i', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'PASSWORD_RESET_REQUEST', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"via":"client@alnoor.ye","codeHidden":false}', 1793218659960);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk3md6000fq1w3slfw49w6', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'PASSWORD_RESET', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', '{"via":"otp"}', 1793218676730);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk3wyj000hq1w3te8fsftm', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', 'شركة النور للتجارة والاستيراد', 'LOGIN', 'Customer', 'cmvmtjybg0062qdb7pkc684zo', NULL, 1793218690459);
INSERT INTO "AuditLog" ("id", "officeId", "actorType", "actorId", "actorName", "action", "entityType", "entityId", "details", "createdAt") VALUES ('cmvsk4adw000jq1w329036hqu', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'cmvmtjy2e001kqdb77c81dk3h', 'أحمد عبدالله', 'LOGIN', 'USER', 'cmvmtjy2e001kqdb77c81dk3h', NULL, 1793218707860);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006nqdb7tnib6hdr', 'cmvmtjybs006gqdb7f1oanzlf', 'الفاتورة التجارية', 1, 0, 1792353358210);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006oqdb78lbfeqq6', 'cmvmtjybs006gqdb7f1oanzlf', 'بوليصة الشحن', 1, 1, 1792353358210);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006pqdb76ehcs8gi', 'cmvmtjybs006gqdb7f1oanzlf', 'قائمة التعبئة', 1, 2, 1792353358210);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006qqdb7w860q669', 'cmvmtjybs006gqdb7f1oanzlf', 'شهادة المنشأ', 1, 3, 1792353358210);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006rqdb76z2lsxc6', 'cmvmtjybs006gqdb7f1oanzlf', 'إذن التسليم', 1, 4, 1792439758210);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006sqdb7zj4ojg2i', 'cmvmtjybs006gqdb7f1oanzlf', 'سداد الرسوم والضرائب', 0, 5, NULL);
INSERT INTO "ChecklistItem" ("id", "shipmentId", "label", "isDone", "sortOrder", "doneAt") VALUES ('cmvmtjybs006tqdb7mh7bubks', 'cmvmtjybs006gqdb7f1oanzlf', 'إذن الإفراج النهائي', 0, 6, NULL);
INSERT INTO "Comment" ("id", "requestId", "officeId", "authorType", "authorName", "body", "isInternal", "createdAt") VALUES ('cmvmtjyck007xqdb7nv0bkvsk', 'cmvmtjyci007pqdb7cfrob58x', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', 'سارة حسن', 'تم إدخال الطلب نيابةً عن العميل عبر الهاتف — بانتظار حضورهم للمستندات الورقية.', 0, 1792698958210);
INSERT INTO "CostItem" ("id", "officeId", "requestId", "category", "label", "amount", "currency", "exchangeRate", "amountBase", "isOfficeFee", "note", "createdByName", "createdAt") VALUES ('cmvmtjyc10072qdb7ton3w1er', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjybw006vqdb7o2f5bm8f', 'REGULATORY', 'رسوم تجديد البطاقة الضريبية', 12000, 'YER', 1, 12000, 0, NULL, 'سارة حسن', 1792526158210);
INSERT INTO "CostItem" ("id", "officeId", "requestId", "category", "label", "amount", "currency", "exchangeRate", "amountBase", "isOfficeFee", "note", "createdByName", "createdAt") VALUES ('cmvmtjyc10073qdb7l6fthogk', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjybw006vqdb7o2f5bm8f', 'OFFICE_FEE', 'أتعاب المكتب — تجديد بطاقة ضريبية', 15000, 'YER', 1, 15000, 1, NULL, 'سارة حسن', 1792526158210);
INSERT INTO "Customer" ("id", "officeId", "name", "customerType", "taxNumber", "crNumber", "phone", "whatsapp", "email", "address", "passwordHash", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjybg0062qdb7pkc684zo', 'cmvmtjy0d001eqdb7sgxbh70e', 'شركة النور للتجارة والاستيراد', 'COMPANY', '3001234567', '12345', '+967 77 200 3000', '+967 77 200 3000', 'client@alnoor.ye', 'عدن - المنصورة', '$2b$10$kQbfHTg7bw413hUSjGRwPunda9o8asgnG4rKwpO9tQzEixz.co1vG', 1793218690457, 1792871758205, 1793218760381);
INSERT INTO "Customer" ("id", "officeId", "name", "customerType", "taxNumber", "crNumber", "phone", "whatsapp", "email", "address", "passwordHash", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjybi0064qdb7a5mn43o0', 'cmvmtjy0d001eqdb7sgxbh70e', 'محمد سالم باعوم', 'INDIVIDUAL', NULL, NULL, '+967 71 111 2222', '+967 71 111 2222', 'mohammed@mail.com', 'عدن - خور مكسر', '$2b$10$jTRSvQ2ceDnjxFN3DsaUi.co34JyzzSdvh/JER6ryQtFB5Z3CgYte', 1792876165552, 1792871758206, 1792876165553);
INSERT INTO "Customer" ("id", "officeId", "name", "customerType", "taxNumber", "crNumber", "phone", "whatsapp", "email", "address", "passwordHash", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjybj0066qdb7j1903e7h', 'cmvmtjy0d001eqdb7sgxbh70e', 'شركة الأمل للمواد الغذائية', 'COMPANY', '3007654321', '67890', '+967 77 900 8000', '+967 77 900 8000', NULL, 'عدن - كريتر', NULL, NULL, 1792871758207, 1792871758207);
INSERT INTO "Customer" ("id", "officeId", "name", "customerType", "taxNumber", "crNumber", "phone", "whatsapp", "email", "address", "passwordHash", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvo649ap000drio1ru74ugxe', 'cmvmtjy0d001eqdb7sgxbh70e', 'شركة المبزي للتجارة و الاستيراد', 'INDIVIDUAL', NULL, NULL, '772210310', '772210310', NULL, NULL, '$2b$10$LTz2cDolZ2lUfr6lKgCWReHmgd.s4gAjgAKojcEyPKE47RO6sDwUW', NULL, 1792953327121, 1792953327121);
INSERT INTO "Customer" ("id", "officeId", "name", "customerType", "taxNumber", "crNumber", "phone", "whatsapp", "email", "address", "passwordHash", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvqz9gu8002optuyawowni9a', 'cmvo8wh6w000frix3hjatqzed', 'العمدة للاستيراد', 'COMPANY', NULL, NULL, '323232323', '3322332334', 'client@alnoor.ye', 'لحج', '$2b$10$nBFkHGohiKgfp5FdJiqQ9eT6PVymLgc0puZRmxM1l0vyRGM00N9TS', NULL, 1793123211393, 1793123211393);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvmtjy0f001hqdb7h45n472t', 'cmvmtjy0d001eqdb7sgxbh70e', 'USD', 1590, 1792871757807);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvmtjy0f001iqdb7t11w6zf3', 'cmvmtjy0d001eqdb7sgxbh70e', 'SAR', 424, 1792871757807);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvmw07pe001aqdpg159cl18u', 'cmvmw07pb0017qdpg10ffanv7', 'USD', 1590, 1792875876098);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvmw07pe001bqdpgoj0laq8k', 'cmvmw07pb0017qdpg10ffanv7', 'SAR', 424, 1792875876098);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvo8wh6y000irix3iruwydqa', 'cmvo8wh6w000frix3hjatqzed', 'USD', 1590, 1792958002955);
INSERT INTO "ExchangeRate" ("id", "officeId", "currency", "rate", "updatedAt") VALUES ('cmvo8wh6y000jrix3u3iwbqvz', 'cmvo8wh6w000frix3hjatqzed', 'SAR', 424, 1792958002955);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002aqdb79jybl9kv', 'cmvmtjy8i001uqdb7enu5j3lc', 'bl_number', 'رقم بوليصة الشحن', 'TEXT', NULL, 1, NULL, 0, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002bqdb7vl6048pm', 'cmvmtjy8i001uqdb7enu5j3lc', 'container_no', 'رقم الحاوية', 'TEXT', NULL, 1, 'مثل: MSCU1234567', 1, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002cqdb702efr3t5', 'cmvmtjy8i001uqdb7enu5j3lc', 'goods_desc', 'وصف البضاعة', 'TEXTAREA', NULL, 1, NULL, 2, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002dqdb723eyjoma', 'cmvmtjy8i001uqdb7enu5j3lc', 'supplier', 'اسم المورد', 'TEXT', NULL, 0, NULL, 3, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002eqdb79repbqwd', 'cmvmtjy8i001uqdb7enu5j3lc', 'origin', 'بلد المنشأ', 'SELECT', 'الصين,الهند,الإمارات,تركيا,السعودية,أخرى', 1, NULL, 4, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8i002fqdb7h7i3jtwv', 'cmvmtjy8i001uqdb7enu5j3lc', 'arrival_date', 'تاريخ الوصول', 'DATE', NULL, 0, NULL, 5, 1792871758098);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002xqdb7m740ckwl', 'cmvmtjy8k002hqdb7ne7zth4w', 'bl_number', 'رقم بوليصة الشحن', 'TEXT', NULL, 1, NULL, 0, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002yqdb77883h4qc', 'cmvmtjy8k002hqdb7ne7zth4w', 'container_no', 'رقم الحاوية', 'TEXT', NULL, 1, NULL, 1, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002zqdb7ebzeedug', 'cmvmtjy8k002hqdb7ne7zth4w', 'goods_desc', 'وصف البضاعة', 'TEXTAREA', NULL, 1, NULL, 2, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k0030qdb7qwqggcmc', 'cmvmtjy8k002hqdb7ne7zth4w', 'supplier', 'اسم المورد', 'TEXT', NULL, 0, NULL, 3, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k0031qdb7lp8gezy3', 'cmvmtjy8k002hqdb7ne7zth4w', 'origin', 'بلد المنشأ', 'SELECT', 'الصين,الهند,الإمارات,تركيا,السعودية,أخرى', 1, NULL, 4, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8k0032qdb709sfa6ye', 'cmvmtjy8k002hqdb7ne7zth4w', 'arrival_date', 'تاريخ الوصول', 'DATE', NULL, 0, NULL, 5, 1792871758100);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8o003kqdb7adc19y40', 'cmvmtjy8n0034qdb7yh7beu46', 'bl_number', 'رقم بوليصة الشحن', 'TEXT', NULL, 1, NULL, 0, 1792871758104);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8o003lqdb7exaozyy6', 'cmvmtjy8n0034qdb7yh7beu46', 'goods_desc', 'وصف البضاعة', 'TEXTAREA', NULL, 1, NULL, 1, 1792871758104);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8o003mqdb7s22llrzv', 'cmvmtjy8n0034qdb7yh7beu46', 'weight', 'الوزن التقريبي (كجم)', 'NUMBER', NULL, 0, NULL, 2, 1792871758104);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8q003xqdb73l0h5mmv', 'cmvmtjy8q003oqdb7hcqjo0ny', 'goods_desc', 'وصف البضاعة', 'TEXTAREA', NULL, 1, NULL, 0, 1792871758106);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8q003yqdb7srnhgc5p', 'cmvmtjy8q003oqdb7hcqjo0ny', 'hs_code', 'رمز النظام المنسق HS (إن وجد)', 'TEXT', NULL, 0, NULL, 1, 1792871758106);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8s004dqdb7jezelp3f', 'cmvmtjy8s0040qdb7etx85pdq', 'bl_number', 'رقم بوليصة الشحن', 'TEXT', NULL, 1, NULL, 0, 1792871758108);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8s004eqdb7jxabwlcp', 'cmvmtjy8s0040qdb7etx85pdq', 'destination', 'الوجهة النهائية', 'TEXT', NULL, 1, NULL, 1, 1792871758108);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8w004rqdb7nh8vmmvj', 'cmvmtjy8w004iqdb7k2jc2m58', 'tax_number', 'الرقم الضريبي', 'TEXT', NULL, 1, NULL, 0, 1792871758112);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8w004sqdb7peq34myf', 'cmvmtjy8w004iqdb7k2jc2m58', 'owner_name', 'اسم المالك / المنشأة', 'TEXT', NULL, 1, NULL, 1, 1792871758112);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8y0053qdb7q9geit6t', 'cmvmtjy8y004uqdb753ypustf', 'activity', 'النشاط التجاري', 'TEXT', NULL, 1, NULL, 0, 1792871758114);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvmtjy8y0054qdb75go58wna', 'cmvmtjy8y004uqdb753ypustf', 'entity_name', 'اسم المنشأة', 'TEXT', NULL, 1, NULL, 1, 1792871758114);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs0028rix3syo5mc98', 'cmvo9oihs0021rix31f9yw3vm', 'from', 'مدينة/مطار المغادرة', 'TEXT', NULL, 1, 'مثل: عدن أو صنعاء', 0, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs0029rix3ezupjcr6', 'cmvo9oihs0021rix31f9yw3vm', 'to', 'الوجهة النهائية', 'TEXT', NULL, 1, NULL, 1, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs002arix31i8yecwg', 'cmvo9oihs0021rix31f9yw3vm', 'depart_date', 'تاريخ المغادرة', 'DATE', NULL, 1, NULL, 2, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs002brix3dkph48gu', 'cmvo9oihs0021rix31f9yw3vm', 'return_date', 'تاريخ العودة (إن وجد)', 'DATE', NULL, 0, NULL, 3, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs002crix3vilpcldd', 'cmvo9oihs0021rix31f9yw3vm', 'passengers', 'عدد المسافرين', 'NUMBER', NULL, 1, NULL, 4, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oihs002drix3mofima56', 'cmvo9oihs0021rix31f9yw3vm', 'cabin', 'درجة المقعد', 'SELECT', 'اقتصادي,اقتصادي مميز,أعمال,أولى', 1, NULL, 5, 1792959311008);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9os2i002trix351tk97el', 'cmvo9os2h002jrix3t9321igt', 'package_type', 'نوع الباقة', 'SELECT', 'اقتصادية,أربع نجوم,خمس نجوم,VIP', 1, NULL, 0, 1792959323418);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9os2i002urix3vrj13x9o', 'cmvo9os2h002jrix3t9321igt', 'departure_city', 'مدينة المغادرة', 'TEXT', NULL, 1, NULL, 1, 1792959323418);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9os2i002vrix3i3mjtxnm', 'cmvo9os2h002jrix3t9321igt', 'adults', 'عدد البالغين', 'NUMBER', NULL, 1, NULL, 2, 1792959323418);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9os2i002wrix31rm5gz5e', 'cmvo9os2h002jrix3t9321igt', 'children', 'عدد الأطفال', 'NUMBER', NULL, 0, NULL, 3, 1792959323418);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9os2i002xrix39trtmt9c', 'cmvo9os2h002jrix3t9321igt', 'room_type', 'نوع الغرفة', 'SELECT', 'ثنائية,ثلاثية,رباعية', 1, NULL, 4, 1792959323418);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg50038rix30q4dftp1', 'cmvo9oyg50031rix3mnwcejc5', 'city', 'المدينة', 'TEXT', NULL, 1, NULL, 0, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg50039rix33fsah288', 'cmvo9oyg50031rix3mnwcejc5', 'check_in', 'تاريخ الوصول', 'DATE', NULL, 1, NULL, 1, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg5003arix3dh7ykedt', 'cmvo9oyg50031rix3mnwcejc5', 'check_out', 'تاريخ المغادرة', 'DATE', NULL, 1, NULL, 2, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg5003brix36fcpyly1', 'cmvo9oyg50031rix3mnwcejc5', 'rooms', 'عدد الغرف', 'NUMBER', NULL, 1, NULL, 3, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg5003crix3grvvi35h', 'cmvo9oyg50031rix3mnwcejc5', 'guests', 'عدد الضيوف', 'NUMBER', NULL, 1, NULL, 4, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9oyg5003drix3sxzlgduc', 'cmvo9oyg50031rix3mnwcejc5', 'stars', 'فئة الفندق', 'SELECT', 'ثلاث نجوم,أربع نجوم,خمس نجوم,شقة فندقية', 1, NULL, 5, 1792959331685);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9pajo003urix3u56b1109', 'cmvo9pajn003jrix32lkga7ai', 'destination', 'دولة الوجهة', 'TEXT', NULL, 1, NULL, 0, 1792959347364);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9pajo003vrix3umek6fwy', 'cmvo9pajn003jrix32lkga7ai', 'visa_type', 'نوع التأشيرة', 'SELECT', 'سياحية,زيارة عائلية,زيارة تجارية قصيرة,علاجية', 1, NULL, 1, 1792959347364);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9pajo003wrix3oeut9uxv', 'cmvo9pajn003jrix32lkga7ai', 'entries', 'عدد مرات الدخول', 'SELECT', 'دخول واحد,دخول متعدد', 1, NULL, 2, 1792959347364);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvo9pajo003xrix3a9cenu1b', 'cmvo9pajn003jrix32lkga7ai', 'travelers', 'عدد المتقدمين', 'NUMBER', NULL, 1, NULL, 3, 1792959347364);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m001zptuy7r8d5pkz', 'cmvqygf0m001jptuy9najc16n', 'bl_number', 'رقم بوليصة الشحن', 'TEXT', NULL, 1, NULL, 0, 1793121856006);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m0020ptuye7nkzymv', 'cmvqygf0m001jptuy9najc16n', 'container_no', 'رقم الحاوية', 'TEXT', NULL, 1, NULL, 1, 1793121856006);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m0021ptuy6598sycf', 'cmvqygf0m001jptuy9najc16n', 'goods_desc', 'وصف البضاعة', 'TEXTAREA', NULL, 1, NULL, 2, 1793121856006);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m0022ptuyd5t4yzdt', 'cmvqygf0m001jptuy9najc16n', 'supplier', 'اسم المورد', 'TEXT', NULL, 0, NULL, 3, 1793121856006);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m0023ptuypiwiqx9k', 'cmvqygf0m001jptuy9najc16n', 'origin', 'بلد المنشأ', 'SELECT', 'الصين,الهند,الإمارات,تركيا,السعودية,أخرى', 1, NULL, 4, 1793121856006);
INSERT INTO "FormField" ("id", "serviceId", "key", "label", "type", "options", "isRequired", "placeholder", "sortOrder", "createdAt") VALUES ('cmvqygf0m0024ptuyef0xzggz', 'cmvqygf0m001jptuy9najc16n', 'arrival_date', 'تاريخ الوصول', 'DATE', NULL, 0, NULL, 5, 1793121856006);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxz60004qdb7jbx62zh4', '030199', 'أسماك حية أخرى', 'Live fish, other', 'كجم', 5, 5, 0, 1, 1792871757762);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxz70005qdb7ps2pp3ng', '100590', 'ذرة (ذرة صفراء) غير مطحونة', 'Maize (corn), other', 'كجم', 5, 5, 0, 1, 1792871757763);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxz80006qdb7o2wei1kv', '100630', 'أرز شبه مبيّض أو مبيّض بالكامل', 'Semi-milled or wholly milled rice', 'كجم', 5, 5, 0, 1, 1792871757764);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxz90007qdb7ypeqhrzj', '110100', 'دقيق قمح', 'Wheat flour', 'كجم', 5, 5, 0, 1, 1792871757765);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxz90008qdb7ghvl8fb1', '170199', 'سكر قصب أو بنجر مكرر آخر', 'Cane or beet sugar, refined', 'كجم', 20, 5, 0, 1, 1792871757766);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxza0009qdb74ww6we6m', '151110', 'زيت نخيل الخام', 'Palm oil, crude', 'لتر', 5, 5, 0, 1, 1792871757767);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzb000aqdb73a7va8jc', '170210', 'سكر جلوكوز في صورة صلبة', 'Glucose in solid form', 'كجم', 15, 5, 0, 1, 1792871757768);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzc000bqdb79te6d5bw', '190211', 'معكرونة غير مطبوخة', 'Uncooked pasta', 'كجم', 15, 5, 0, 1, 1792871757769);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzd000cqdb7zcqwi3gz', '210690', 'مستحضرات غذائية غير محددة', 'Food preparations n.e.s.', 'كجم', 20, 5, 0, 1, 1792871757770);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxze000dqdb76paqrunr', '220210', 'مياه معدنية ومشروبات غير كحولية', 'Waters & non-alcoholic beverages', 'لتر', 20, 5, 0, 1, 1792871757771);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzg000eqdb7zkyhviz1', '240220', 'سجائر تحتوي تبغاً', 'Cigarettes containing tobacco', 'ألف حبة', 100, 20, 0, 1, 1792871757772);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzh000fqdb7qwp92yc7', '252329', 'أسمنت بورتلاندي آخر', 'Other Portland cement', 'كجم', 10, 5, 0, 1, 1792871757773);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzi000gqdb7e8hcqir6', '271019', 'زيوت نفطية أخرى (سولار/ديزل)', 'Other petroleum oils', 'لتر', 5, 5, 0, 1, 1792871757774);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzi000hqdb7fnhs9yfe', '300490', 'أدوية معبأة للبيع بالتجزئة', 'Medicaments, packaged', 'كجم', 5, 0, 0, 1, 1792871757775);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzk000iqdb7grnpjgy3', '330499', 'مستحضرات تجميل أخرى', 'Beauty preparations n.e.s.', 'كجم', 25, 5, 0, 1, 1792871757776);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzk000jqdb7p26mj3y3', '340250', 'منظفات ومواد تلميع', 'Preparations for washing/cleaning', 'كجم', 20, 5, 0, 1, 1792871757777);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzl000kqdb7ravb328m', '380891', 'مبيدات حشرية', 'Insecticides', 'كجم', 5, 5, 0, 1, 1792871757777);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzl000lqdb7ygh3lk28', '392010', 'صفائح وأغشية من بلاستيك البولي إيثيلين', 'Plates/sheets of polymers of ethylene', 'كجم', 15, 5, 0, 1, 1792871757778);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzm000mqdb7ysjohi4z', '392321', 'أكياس من البلاستيك', 'Sacks and bags of plastics', 'كجم', 15, 5, 0, 1, 1792871757779);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzn000nqdb7d0mbx1nj', '401110', 'إطارات مطاطية جديدة للسيارات', 'New pneumatic tyres, cars', 'قطعة', 15, 5, 0, 1, 1792871757779);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzn000oqdb75h6c7vyb', '481910', 'كراتين من الورق المقوى', 'Cartons of corrugated paper', 'كجم', 15, 5, 0, 1, 1792871757780);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzo000pqdb7bxzlv8f0', '520512', 'غزل قطني مفرد', 'Single cotton yarn', 'كجم', 15, 5, 0, 1, 1792871757780);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzo000qqdb7899tw35f', '540761', 'أقمشة من نسج البوليستر', 'Woven fabrics of polyester', 'متر', 20, 5, 0, 1, 1792871757781);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzq000rqdb7q340ylel', '610910', 'تيشيرتات قطنية موصولة', 'T-shirts, cotton, knitted', 'قطعة', 20, 5, 0, 1, 1792871757783);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzr000sqdb78um81crm', '640399', 'أحذية بأسطح من الجلد الطبيعي', 'Footwear, leather uppers', 'زوج', 25, 5, 0, 1, 1792871757784);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzs000tqdb7n8tw0n9g', '701090', 'أوعية زجاجية للمواد الغذائية', 'Glass containers for food', 'كجم', 15, 5, 0, 1, 1792871757785);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzu000uqdb7h7286nw5', '720851', 'منتجات مسطحة من حديد غير مطلي', 'Flat-rolled iron, non-alloy steel', 'كجم', 10, 5, 0, 1, 1792871757786);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzv000vqdb7t5c71yby', '730890', 'منشآت وأجزاء من حديد للمباني', 'Structures/parts of iron', 'كجم', 10, 5, 0, 1, 1792871757788);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzw000wqdb7pegk1bm9', '731815', 'براغي ومسامير من حديد أو فولاذ', 'Bolts and screws', 'كجم', 10, 5, 0, 1, 1792871757789);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzx000xqdb7h8v9kfap', '841370', 'مضخات طرد مركزي للسوائل', 'Centrifugal pumps', 'قطعة', 10, 5, 0, 1, 1792871757790);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzy000yqdb7y52oj29t', '841581', 'أجهزة تكييف هوائية', 'Air conditioners', 'قطعة', 15, 5, 0, 1, 1792871757790);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzy000zqdb7z0mquk1a', '847130', 'أجهزة معالجة بيانات محمولة (حاسوب)', 'Portable data processing machines', 'قطعة', 5, 5, 0, 1, 1792871757791);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjxzz0010qdb7c08y8gt2', '851713', 'هواتف ذكية', 'Smartphones', 'قطعة', 5, 5, 0, 1, 1792871757791);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy000011qdb7934bu350', '853400', 'لوحات دوائر مطبوعة', 'Printed circuits', 'كجم', 5, 5, 0, 1, 1792871757793);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy010012qdb7xvritx6p', '854140', 'خلايا شمسية ووحدات كهروضوئية', 'Photovoltaic cells/modules', 'قطعة', 5, 5, 0, 1, 1792871757793);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy010013qdb7u69kznp5', '870323', 'سيارات ركوب سعة 1500-3000 سم³', 'Motor cars 1500-3000cc', 'قطعة', 25, 5, 0, 1, 1792871757794);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy020014qdb7808vjjr2', '870421', 'شاحنات نقل بضائع', 'Goods transport vehicles', 'قطعة', 25, 5, 0, 1, 1792871757794);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy030015qdb7nj7qv4hv', '870899', 'قطع غيار السيارات الأخرى', 'Motor vehicle parts n.e.s.', 'كجم', 15, 5, 0, 1, 1792871757795);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy030016qdb7supbznre', '940360', 'أثاث خشبي آخر', 'Other wooden furniture', 'قطعة', 25, 5, 0, 1, 1792871757796);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy040017qdb7ldyzo8vk', '940511', 'ثريات كهربائية', 'Electrical chandeliers', 'قطعة', 20, 5, 0, 1, 1792871757796);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy050018qdb7zadtfrel', '320810', 'دهانات وطلاءات', 'Paints and varnishes', 'كجم', 20, 5, 0, 1, 1792871757797);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy050019qdb7msimxgku', '350610', 'مواد لاصقة', 'Adhesives', 'كجم', 15, 5, 0, 1, 1792871757798);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy06001aqdb7d6cr43rl', '381600', 'مواد كيميائية صناعية أخرى', 'Other industrial chemicals', 'كجم', 10, 5, 0, 1, 1792871757799);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy08001bqdb7pbsy6cfs', '760110', 'ألومنيوم غير مطلي', 'Aluminium, not alloyed', 'كجم', 10, 5, 0, 1, 1792871757800);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy09001cqdb7uz7cvs3v', '691010', 'أحواض ومغاسل خزفية', 'Ceramic sinks/washbasins', 'قطعة', 20, 5, 0, 1, 1792871757801);
INSERT INTO "HSCode" ("id", "code", "descriptionAr", "descriptionEn", "unit", "dutyRate", "salesTaxRate", "otherTaxRate", "isActive", "updatedAt") VALUES ('cmvmtjy0a001dqdb77l4zfflp', '630260', 'مناشف مطبخ وحمام من قطن', 'Terry towels of cotton', 'كجم', 20, 5, 0, 1, 1792871757803);
INSERT INTO "Invoice" ("id", "officeId", "customerId", "requestId", "invoiceNumber", "items", "subtotal", "total", "currency", "status", "issueDate", "dueDate", "note", "createdAt") VALUES ('cmvmtjyc30077qdb7kpd9ke09', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjybg0062qdb7pkc684zo', 'cmvmtjybw006vqdb7o2f5bm8f', 'INV-2026-0001', '[{"label":"رسوم تجديد البطاقة الضريبية","amount":12000},{"label":"أتعاب المكتب — تجديد بطاقة ضريبية","amount":15000}]', 27000, 27000, 'YER', 'PAID', 1792612558210, NULL, NULL, 1792871758228);
INSERT INTO "License" ("id", "officeId", "key", "planId", "durationDays", "startDate", "endDate", "status", "activatedAt", "note", "createdAt") VALUES ('cmvmtjy0e001gqdb768mxk50i', 'cmvmtjy0d001eqdb7sgxbh70e', 'MRX-DEMO-2026-RED1', 'cmvmtjxz40002qdb78vjgmhr3', 365, 1792871757805, 1820519757805, 'ACTIVE', 1792871757805, NULL, 1792871757806);
INSERT INTO "License" ("id", "officeId", "key", "planId", "durationDays", "startDate", "endDate", "status", "activatedAt", "note", "createdAt") VALUES ('cmvmw07pc0019qdpgaze8kk0e', 'cmvmw07pb0017qdpg10ffanv7', 'MRX-TYYA-T9PT-FCXU', 'cmvmtjxz20001qdb7u9rj0nyb', 365, 1792875969577, 1855947969577, 'ACTIVE', 1792875969577, NULL, 1792875876097);
INSERT INTO "License" ("id", "officeId", "key", "planId", "durationDays", "startDate", "endDate", "status", "activatedAt", "note", "createdAt") VALUES ('cmvo8wh6x000hrix3sni9t05x', 'cmvo8wh6w000frix3hjatqzed', 'MRX-NRUN-Y87B-DNS7', 'cmvmtjxz50003qdb7u0m885xj', 3, 1792958248299, 1793217448299, 'ACTIVE', 1792958248299, NULL, 1792958002954);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmvv5sn000oqdpgg7et2fnu', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmvv5rd0005qdpgz780bmxf', 'INAPP', 'فريق المكتب', 'طلب جديد وارد 📩', 'طلب REDS-2026-0006 من العميل شركة النور للتجارة والاستيراد لخدمة تخليص حاوية 20 قدم.', 'SENT', NULL, 1, 1792875640343, 1792875640344);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmvyvks0010qdpg4erzypd1', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmvv5rd0005qdpgz780bmxf', 'INAPP', 'شركة النور للتجارة والاستيراد', 'تحديث حالة الطلب', 'طلبكم REDS-2026-0006 انتقل إلى مرحلة: قيد التدقيق المستندي.', 'SENT', NULL, 1, 1792875813724, 1792875813725);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmvyvkv0012qdpg18a04png', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmvv5rd0005qdpgz780bmxf', 'WHATSAPP', '+967 77 200 3000', NULL, 'تحديث طلبكم REDS-2026-0006: قيد التدقيق المستندي — /track/734228fd862761a77328b4c64d80ef70', 'SENT', NULL, 1, 1792875813726, 1792875813728);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmw07pf001dqdpgbcpl5bxh', 'cmvmw07pb0017qdpg10ffanv7', NULL, 'EMAIL', 'manager@adentrade.ye', 'دعوة تفعيل مكتب مكتب عدن التجاري للتخليص — منصة مراسي', 'السيد/ة محمد الشميري،

تم إنشاء حساب مكتبكم «مكتب عدن التجاري للتخليص» على منصة مراسي.

مفتاح التفعيل: MRX-TYYA-T9PT-FCXU
رابط التفعيل: /activate

يرجى الاحتفاظ بالمفتاح بسرّية وتفعيل الحساب خلال مدة صلاحية الترخيص (365 يوماً).

مع التقدير،
إدارة منصة مراسي', 'SENT', NULL, 1, 1792875876098, 1792875876099);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmw5p45000bqd9w208tu3w4', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'محمد سالم باعوم', 'استكمال مستندات ناقصة', 'طلبكم RED-2026-0003 بحاجة إلى استكمال المستندات التالية: الفاتورة التجارية، بوليصة الشحن. الموعد النهائي: 27 أكتوبر 2026', 'SENT', NULL, 1, 1792876131940, 1792876131942);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmw5p49000dqd9w1uwspvvh', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'WHATSAPP', '+967 71 111 2222', NULL, 'عميلنا الكريم محمد سالم باعوم، لاستكمال طلبكم RED-2026-0003 يلزم رفع: الفاتورة التجارية، بوليصة الشحن قبل 27 أكتوبر 2026. ارفعوها من: /track/8e6409caba4568b94c3181b7001ffc0e', 'SENT', NULL, 1, 1792876131945, 1792876131946);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvmw7yri000uqd9wjp2bz94i', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'فريق المكتب', 'استكمال مستندات من العميل', 'العميل محمد سالم باعوم رفع مستند «الفاتورة التجارية» للطلب RED-2026-0003 — جاهز لإعادة المراجعة.', 'SENT', NULL, 1, 1792876237757, 1792876237758);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvo6c8pw000srio1hiz85mvl', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvo6c8pi000hrio13huh64v2', 'INAPP', 'فريق المكتب', 'طلب جديد وارد 📩', 'طلب REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', 'SENT', NULL, 1, 1792953699620, 1792953699621);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvo6c8q1000urio1bu8y8yy9', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvo6c8pi000hrio13huh64v2', 'EMAIL', 'غير متوفر', 'طلب جديد REDS-2026-0007', 'عميلنا الكريم شركة المبزي للتجارة و الاستيراد،
تم استلام طلبكم رقم REDS-2026-0007 لخدمة استخراج / تجديد السجل التجاري وسيبدأ فريقنا بمراجعته فوراً.
رابط التتبع: /track/554de48d13da4f25ff42e71a0e8fd29b', 'SENT', NULL, 1, 1792953699624, 1792953699625);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvo6c8q3000yrio12rjkygcl', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvo6c8pi000hrio13huh64v2', 'INAPP', 'شركة المبزي للتجارة و الاستيراد', 'طلب جديد وارد', 'ورد طلب جديد REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', 'SENT', NULL, 1, 1792953699627, 1792953699628);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvo6c8q60010rio1h2yoonfe', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvo6c8pi000hrio13huh64v2', 'WHATSAPP', 'غير متوفر', NULL, 'عميلنا الكريم شركة المبزي للتجارة و الاستيراد، تم استلام طلبكم REDS-2026-0007 (استخراج / تجديد السجل التجاري). تابعوه عبر: /track/554de48d13da4f25ff42e71a0e8fd29b', 'SENT', NULL, 1, 1792953699629, 1792953699630);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvo8wh6z000lrix3s33p1uzi', 'cmvo8wh6w000frix3hjatqzed', NULL, 'EMAIL', 'supportaldalal@gmail.com', 'دعوة تفعيل مكتب بن خليل للسفريات و السياحة و  الخدمات اللوجستية — منصة مراسي', 'السيد/ة بن خليل،

تم إنشاء حساب مكتبكم «بن خليل للسفريات و السياحة و  الخدمات اللوجستية» على منصة مراسي.

مفتاح التفعيل: MRX-NRUN-Y87B-DNS7
رابط التفعيل: /activate

يرجى الاحتفاظ بالمفتاح بسرّية وتفعيل الحساب خلال مدة صلاحية الترخيص (3 يوماً).

مع التقدير،
إدارة منصة مراسي', 'SENT', NULL, 1, 1792958002955, 1792958002956);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvoapetx0053rix3xeg1v4lb', 'cmvo8wh6w000frix3hjatqzed', NULL, 'INAPP', 'فريق المكتب', 'طلب جديد وارد 📩', 'طلب BENK-2026-0001 من العميل عميل اختبار مراسي لخدمة نقل بري وتوصيل المطار.', 'SENT', NULL, 1, 1792961032532, 1792961032533);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvoapeu20055rix3qarzgit6', 'cmvo8wh6w000frix3hjatqzed', NULL, 'EMAIL', 'غير متوفر', 'طلب جديد BENK-2026-0001', 'عميلنا الكريم عميل اختبار مراسي،
تم استلام طلبكم رقم BENK-2026-0001 لخدمة نقل بري وتوصيل المطار وسيبدأ فريقنا بمراجعته فوراً.
رابط التتبع: /track/f233f4e48dcbe8d8be0c51e60ae025ae', 'SENT', NULL, 1, 1792961032537, 1792961032538);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvoapeu50059rix3sfada2hq', 'cmvo8wh6w000frix3hjatqzed', NULL, 'INAPP', 'عميل اختبار مراسي', 'طلب جديد وارد', 'ورد طلب جديد BENK-2026-0001 من العميل عميل اختبار مراسي لخدمة نقل بري وتوصيل المطار.', 'SENT', NULL, 1, 1792961032540, 1792961032541);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvoapeu7005brix3qz37h4b0', 'cmvo8wh6w000frix3hjatqzed', NULL, 'WHATSAPP', 'غير متوفر', NULL, 'عميلنا الكريم عميل اختبار مراسي، تم استلام طلبكم BENK-2026-0001 (نقل بري وتوصيل المطار). تابعوه عبر: /track/f233f4e48dcbe8d8be0c51e60ae025ae', 'SENT', NULL, 1, 1792961032543, 1792961032544);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy406u000eptuyzcqtw3gd', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'فريق المكتب', 'تكليف بطلب جديد', 'تم إسناد الطلب RED-2026-0003 إليك — خدمة تخليص بضائع عامة (LCL).', 'SENT', NULL, 1, 1793121276918, 1793121276919);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy45vs000jptuyogo4reh6', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'فريق المكتب', 'تكليف بطلب جديد', 'تم إسناد الطلب RED-2026-0003 إليك — خدمة تخليص بضائع عامة (LCL).', 'SENT', NULL, 1, 1793121284295, 1793121284296);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy4wgc000pptuy7g3v4hjo', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'محمد سالم باعوم', 'تم قبول طلبكم', 'تم قبول طلبكم RED-2026-0003. المدة المتوقعة للإنجاز: 8 يوم عمل، والتاريخ المتوقع: 8 نوفمبر 2026.', 'SENT', NULL, 1, 1793121318731, 1793121318732);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy4wgf000rptuynn003hlc', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'WHATSAPP', '+967 71 111 2222', NULL, 'عميلنا الكريم محمد سالم باعوم، تم قبول طلبكم RED-2026-0003 (تخليص بضائع عامة (LCL)). المدة المتوقعة 8 يوم عمل — التسليم المتوقع: 8 نوفمبر 2026', 'SENT', NULL, 1, 1793121318734, 1793121318735);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy5oyi0011ptuy2xk83c91', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'محمد سالم باعوم', 'تحديث حالة الطلب', 'طلبكم RED-2026-0003 انتقل إلى مرحلة: فتح البيان الجمركي.', 'SENT', NULL, 1, 1793121355673, 1793121355674);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy5oyq0013ptuysa825ltz', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'WHATSAPP', '+967 71 111 2222', NULL, 'تحديث طلبكم RED-2026-0003: فتح البيان الجمركي — /track/8e6409caba4568b94c3181b7001ffc0e', 'SENT', NULL, 1, 1793121355676, 1793121355682);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy5pss001bptuyznvguvam', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'INAPP', 'محمد سالم باعوم', 'تحديث حالة الطلب', 'طلبكم RED-2026-0003 انتقل إلى مرحلة: فتح البيان الجمركي.', 'SENT', NULL, 1, 1793121356764, 1793121356765);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvqy5psv001dptuyfut3beri', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjyc60079qdb7chtfplmj', 'WHATSAPP', '+967 71 111 2222', NULL, 'تحديث طلبكم RED-2026-0003: فتح البيان الجمركي — /track/8e6409caba4568b94c3181b7001ffc0e', 'SENT', NULL, 1, 1793121356766, 1793121356767);
INSERT INTO "MessageLog" ("id", "officeId", "requestId", "channel", "recipient", "subject", "body", "status", "error", "attempts", "sentAt", "createdAt") VALUES ('cmvsk39fa000bq1w3vp1uvb38', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'WHATSAPP', '+967 77 200 3000', 'رمز استعادة كلمة مرور', 'مرحباً شركة النور للتجارة والاستيراد،
رمز استعادة كلمة المرور الخاص بك في منصة مراسي هو: 804526
الرمز صالح لمدة 15 دقيقة. إن لم تطلبه فتجاهل هذه الرسالة.', 'SENT', NULL, 1, 1793218659957, 1793218659958);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmvv5sl000kqdpg24xbk20v', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy2e001kqdb77c81dk3h', 'cmvmvv5rd0005qdpgz780bmxf', 'طلب جديد وارد 📩', 'طلب REDS-2026-0006 من العميل شركة النور للتجارة والاستيراد لخدمة تخليص حاوية 20 قدم.', NULL, 0, 1792875640341);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmvv5sl000lqdpgmwq0vbja', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy4e001mqdb7wckj46o8', 'cmvmvv5rd0005qdpgz780bmxf', 'طلب جديد وارد 📩', 'طلب REDS-2026-0006 من العميل شركة النور للتجارة والاستيراد لخدمة تخليص حاوية 20 قدم.', NULL, 0, 1792875640341);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmvv5sl000mqdpgdn80i5rt', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy8e001qqdb7fhtfhegf', 'cmvmvv5rd0005qdpgz780bmxf', 'طلب جديد وارد 📩', 'طلب REDS-2026-0006 من العميل شركة النور للتجارة والاستيراد لخدمة تخليص حاوية 20 قدم.', NULL, 0, 1792875640341);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmvyvkr000yqdpgb0332n7k', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybg0062qdb7pkc684zo', NULL, 'cmvmvv5rd0005qdpgz780bmxf', 'تحديث حالة الطلب', 'طلبكم REDS-2026-0006 انتقل إلى مرحلة: قيد التدقيق المستندي.', '/track/734228fd862761a77328b4c64d80ef70', 0, 1792875813723);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmw5p420009qd9wi67q84im', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', NULL, 'cmvmtjyc60079qdb7chtfplmj', 'استكمال مستندات ناقصة', 'طلبكم RED-2026-0003 بحاجة إلى استكمال المستندات التالية: الفاتورة التجارية، بوليصة الشحن. الموعد النهائي: 27 أكتوبر 2026', '/track/8e6409caba4568b94c3181b7001ffc0e', 0, 1792876131938);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmw7yrg000qqd9wbkdg8yem', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy2e001kqdb77c81dk3h', 'cmvmtjyc60079qdb7chtfplmj', 'استكمال مستندات من العميل', 'العميل محمد سالم باعوم رفع مستند «الفاتورة التجارية» للطلب RED-2026-0003 — جاهز لإعادة المراجعة.', NULL, 0, 1792876237757);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmw7yrg000rqd9w42za8ok0', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy4e001mqdb7wckj46o8', 'cmvmtjyc60079qdb7chtfplmj', 'استكمال مستندات من العميل', 'العميل محمد سالم باعوم رفع مستند «الفاتورة التجارية» للطلب RED-2026-0003 — جاهز لإعادة المراجعة.', NULL, 0, 1792876237757);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvmw7yrg000sqd9woahnvzf3', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy8e001qqdb7fhtfhegf', 'cmvmtjyc60079qdb7chtfplmj', 'استكمال مستندات من العميل', 'العميل محمد سالم باعوم رفع مستند «الفاتورة التجارية» للطلب RED-2026-0003 — جاهز لإعادة المراجعة.', NULL, 0, 1792876237757);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvo6c8pv000orio1uj8m44w5', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy2e001kqdb77c81dk3h', 'cmvo6c8pi000hrio13huh64v2', 'طلب جديد وارد 📩', 'طلب REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', NULL, 0, 1792953699619);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvo6c8pv000prio1wb3uoqbw', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy4e001mqdb7wckj46o8', 'cmvo6c8pi000hrio13huh64v2', 'طلب جديد وارد 📩', 'طلب REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', NULL, 0, 1792953699619);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvo6c8pv000qrio1ov4fpfg3', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy8e001qqdb7fhtfhegf', 'cmvo6c8pi000hrio13huh64v2', 'طلب جديد وارد 📩', 'طلب REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', NULL, 0, 1792953699619);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvo6c8q2000wrio1dy2kk3hc', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvo649ap000drio1ru74ugxe', NULL, 'cmvo6c8pi000hrio13huh64v2', 'طلب جديد وارد', 'ورد طلب جديد REDS-2026-0007 من العميل شركة المبزي للتجارة و الاستيراد لخدمة استخراج / تجديد السجل التجاري.', '/track/554de48d13da4f25ff42e71a0e8fd29b', 0, 1792953699626);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvqy406s000cptuyxj9jkpha', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy2e001kqdb77c81dk3h', 'cmvmtjyc60079qdb7chtfplmj', 'تكليف بطلب جديد', 'تم إسناد الطلب RED-2026-0003 إليك — خدمة تخليص بضائع عامة (LCL).', NULL, 0, 1793121276917);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvqy45vq000hptuya1y5vtt6', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy4e001mqdb7wckj46o8', 'cmvmtjyc60079qdb7chtfplmj', 'تكليف بطلب جديد', 'تم إسناد الطلب RED-2026-0003 إليك — خدمة تخليص بضائع عامة (LCL).', NULL, 0, 1793121284294);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvqy4wga000nptuys7lhadoa', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', NULL, 'cmvmtjyc60079qdb7chtfplmj', 'تم قبول طلبكم', 'تم قبول طلبكم RED-2026-0003. المدة المتوقعة للإنجاز: 8 يوم عمل، والتاريخ المتوقع: 8 نوفمبر 2026.', '/track/8e6409caba4568b94c3181b7001ffc0e', 0, 1793121318731);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvqy5oyg000zptuyaz0lt3bm', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', NULL, 'cmvmtjyc60079qdb7chtfplmj', 'تحديث حالة الطلب', 'طلبكم RED-2026-0003 انتقل إلى مرحلة: فتح البيان الجمركي.', '/track/8e6409caba4568b94c3181b7001ffc0e', 0, 1793121355672);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvqy5psr0019ptuy7oj4pucx', 'cmvmtjy0d001eqdb7sgxbh70e', 'CUSTOMER', 'cmvmtjybi0064qdb7a5mn43o0', NULL, 'cmvmtjyc60079qdb7chtfplmj', 'تحديث حالة الطلب', 'طلبكم RED-2026-0003 انتقل إلى مرحلة: فتح البيان الجمركي.', '/track/8e6409caba4568b94c3181b7001ffc0e', 0, 1793121356763);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvsk39f80008q1w38vs30z4y', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy2e001kqdb77c81dk3h', NULL, 'طلب استعادة كلمة مرور', 'طلب العميل شركة النور للتجارة والاستيراد (***3000) استعادة كلمة المرور. أرسل له الرمز عبر واتساب من الزر أدناه — الرمز صالح 15 دقيقة.', 'https://wa.me/967772003000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%86%D9%88%D8%B1%20%D9%84%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D8%A9%20%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%8A%D8%B1%D8%A7%D8%AF%D8%8C%0A%D8%B1%D9%85%D8%B2%20%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9%20%D9%83%D9%84%D9%85%D8%A9%20%D8%A7%D9%84%D9%85%D8%B1%D9%88%D8%B1%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D9%83%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20%D9%85%D8%B1%D8%A7%D8%B3%D9%8A%20%D9%87%D9%88%3A%20804526%0A%D8%A7%D9%84%D8%B1%D9%85%D8%B2%20%D8%B5%D8%A7%D9%84%D8%AD%20%D9%84%D9%85%D8%AF%D8%A9%2015%20%D8%AF%D9%82%D9%8A%D9%82%D8%A9.%20%D8%A5%D9%86%20%D9%84%D9%85%20%D8%AA%D8%B7%D9%84%D8%A8%D9%87%20%D9%81%D8%AA%D8%AC%D8%A7%D9%87%D9%84%20%D9%87%D8%B0%D9%87%20%D8%A7%D9%84%D8%B1%D8%B3%D8%A7%D9%84%D8%A9.', 0, 1793218659956);
INSERT INTO "Notification" ("id", "officeId", "recipientType", "customerId", "userId", "requestId", "title", "body", "link", "isRead", "createdAt") VALUES ('cmvsk39f80009q1w3i4g5ynis', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAFF', NULL, 'cmvmtjy4e001mqdb7wckj46o8', NULL, 'طلب استعادة كلمة مرور', 'طلب العميل شركة النور للتجارة والاستيراد (***3000) استعادة كلمة المرور. أرسل له الرمز عبر واتساب من الزر أدناه — الرمز صالح 15 دقيقة.', 'https://wa.me/967772003000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%86%D9%88%D8%B1%20%D9%84%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D8%A9%20%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%8A%D8%B1%D8%A7%D8%AF%D8%8C%0A%D8%B1%D9%85%D8%B2%20%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9%20%D9%83%D9%84%D9%85%D8%A9%20%D8%A7%D9%84%D9%85%D8%B1%D9%88%D8%B1%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D9%83%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20%D9%85%D8%B1%D8%A7%D8%B3%D9%8A%20%D9%87%D9%88%3A%20804526%0A%D8%A7%D9%84%D8%B1%D9%85%D8%B2%20%D8%B5%D8%A7%D9%84%D8%AD%20%D9%84%D9%85%D8%AF%D8%A9%2015%20%D8%AF%D9%82%D9%8A%D9%82%D8%A9.%20%D8%A5%D9%86%20%D9%84%D9%85%20%D8%AA%D8%B7%D9%84%D8%A8%D9%87%20%D9%81%D8%AA%D8%AC%D8%A7%D9%87%D9%84%20%D9%87%D8%B0%D9%87%20%D8%A7%D9%84%D8%B1%D8%B3%D8%A7%D9%84%D8%A9.', 0, 1793218659956);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy900056qdb7e4c169pc', 'cmvmtjy0d001eqdb7sgxbh70e', 'NEW_REQUEST', 'INAPP', 'طلب جديد وارد', 'ورد طلب جديد {{request_number}} من العميل {{client_name}} لخدمة {{service_name}}.', 1, 1792871758117, 1792871758117);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy910058qdb7yzsq6fii', 'cmvmtjy0d001eqdb7sgxbh70e', 'NEW_REQUEST', 'EMAIL', 'طلب جديد {{request_number}}', 'عميلنا الكريم {{client_name}}،
تم استلام طلبكم رقم {{request_number}} لخدمة {{service_name}} وسيبدأ فريقنا بمراجعته فوراً.
رابط التتبع: {{track_link}}', 1, 1792871758118, 1792871758118);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy92005aqdb7469mcv9r', 'cmvmtjy0d001eqdb7sgxbh70e', 'NEW_REQUEST', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم استلام طلبكم {{request_number}} ({{service_name}}). تابعوه عبر: {{track_link}}', 1, 1792871758119, 1792871758119);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy94005cqdb79hhq4ie2', 'cmvmtjy0d001eqdb7sgxbh70e', 'MISSING_DOCS', 'INAPP', 'استكمال مستندات ناقصة', 'طلبكم {{request_number}} بحاجة إلى استكمال المستندات التالية: {{missing_docs}}. الموعد النهائي: {{deadline}}', 1, 1792871758120, 1792871758120);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy94005eqdb73viryh3e', 'cmvmtjy0d001eqdb7sgxbh70e', 'MISSING_DOCS', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، لاستكمال طلبكم {{request_number}} يلزم رفع: {{missing_docs}} قبل {{deadline}}. ارفعوها من: {{track_link}}', 1, 1792871758121, 1792871758121);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy95005gqdb7k2l9twmj', 'cmvmtjy0d001eqdb7sgxbh70e', 'ACCEPTED', 'INAPP', 'تم قبول طلبكم', 'تم قبول طلبكم {{request_number}}. المدة المتوقعة للإنجاز: {{estimated_days}} يوم عمل، والتاريخ المتوقع: {{expected_date}}.', 1, 1792871758121, 1792871758121);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy96005iqdb7686e5efw', 'cmvmtjy0d001eqdb7sgxbh70e', 'ACCEPTED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم قبول طلبكم {{request_number}} ({{service_name}}). المدة المتوقعة {{estimated_days}} يوم عمل — التسليم المتوقع: {{expected_date}}', 1, 1792871758122, 1792871758122);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy97005kqdb7lyponm2f', 'cmvmtjy0d001eqdb7sgxbh70e', 'REJECTED', 'INAPP', 'تم رفض الطلب', 'نعتذر، تم رفض طلبكم {{request_number}} للسبب التالي: {{reason}}', 1, 1792871758124, 1792871758124);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy99005mqdb7km10wbt5', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAGE_CHANGE', 'INAPP', 'تحديث حالة الطلب', 'طلبكم {{request_number}} انتقل إلى مرحلة: {{stage_name}}.', 1, 1792871758125, 1792871758125);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9c005oqdb7wi0cljcv', 'cmvmtjy0d001eqdb7sgxbh70e', 'STAGE_CHANGE', 'WHATSAPP', NULL, 'تحديث طلبكم {{request_number}}: {{stage_name}} — {{track_link}}', 1, 1792871758128, 1792871758128);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9d005qqdb7gqlbtxsz', 'cmvmtjy0d001eqdb7sgxbh70e', 'COMPLETED', 'INAPP', 'اكتملت معاملتكم 🎉', 'اكتمل تنفيذ طلبكم {{request_number}} ({{service_name}}). المستندات النهائية متاحة عبر رابط التتبع: {{track_link}}', 1, 1792871758129, 1792871758129);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9d005sqdb7g27xmf02', 'cmvmtjy0d001eqdb7sgxbh70e', 'COMPLETED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، اكتملت معاملتكم {{request_number}} ✅ المستندات النهائية وتفاصيل الاستلام: {{track_link}}', 1, 1792871758130, 1792871758130);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9e005uqdb7cjvbe4ws', 'cmvmtjy0d001eqdb7sgxbh70e', 'COMPLETED', 'EMAIL', 'اكتمال المعاملة {{request_number}}', 'عميلنا الكريم {{client_name}}،
يسرنا إبلاغكم باكتمال معاملتكم {{request_number}} لخدمة {{service_name}}.
يمكنكم تحميل المستندات النهائية وتفاصيل الاستلام عبر: {{track_link}}
شكراً لثقتكم.', 1, 1792871758131, 1792871758131);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9f005wqdb7s1afh4yq', 'cmvmtjy0d001eqdb7sgxbh70e', 'ASSIGNED', 'INAPP', 'تكليف بطلب جديد', 'تم إسناد الطلب {{request_number}} إليكم.', 1, 1792871758131, 1792871758131);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9g005yqdb7itmoezcu', 'cmvmtjy0d001eqdb7sgxbh70e', 'DELAYED', 'INAPP', 'تأخر عن المدة المتوقعة', 'الطلب {{request_number}} تجاوز التاريخ المتوقع للإنجاز {{expected_date}}.', 1, 1792871758132, 1792871758132);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmtjy9g0060qdb77itt9ymu', 'cmvmtjy0d001eqdb7sgxbh70e', 'PAYMENT_DUE', 'INAPP', 'استحقاق دفعة', 'الطلب {{request_number}}: المتبقي المستحق {{remaining}}.', 1, 1792871758133, 1792871758133);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27wv002lqdpgazk39suo', 'cmvmw07pb0017qdpg10ffanv7', 'NEW_REQUEST', 'INAPP', 'طلب جديد وارد', 'ورد طلب جديد {{request_number}} من العميل {{client_name}} لخدمة {{service_name}}.', 1, 1792875969679, 1792875969679);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27ww002nqdpg3wxepi0t', 'cmvmw07pb0017qdpg10ffanv7', 'NEW_REQUEST', 'EMAIL', 'طلب جديد {{request_number}}', 'عميلنا الكريم {{client_name}}،
تم استلام طلبكم رقم {{request_number}} لخدمة {{service_name}} وسيبدأ فريقنا بمراجعته فوراً.
رابط التتبع: {{track_link}}', 1, 1792875969681, 1792875969681);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27wy002pqdpgx4zu7ft0', 'cmvmw07pb0017qdpg10ffanv7', 'NEW_REQUEST', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم استلام طلبكم {{request_number}} ({{service_name}}). تابعوه عبر: {{track_link}}', 1, 1792875969682, 1792875969682);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x0002rqdpgqm328ksv', 'cmvmw07pb0017qdpg10ffanv7', 'MISSING_DOCS', 'INAPP', 'استكمال مستندات ناقصة', 'طلبكم {{request_number}} بحاجة إلى استكمال المستندات التالية: {{missing_docs}}. الموعد النهائي: {{deadline}}', 1, 1792875969685, 1792875969685);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x1002tqdpgjbvrmzhb', 'cmvmw07pb0017qdpg10ffanv7', 'MISSING_DOCS', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، لاستكمال طلبكم {{request_number}} يلزم رفع: {{missing_docs}} قبل {{deadline}}. ارفعوها من: {{track_link}}', 1, 1792875969686, 1792875969686);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x2002vqdpgafevoj1j', 'cmvmw07pb0017qdpg10ffanv7', 'ACCEPTED', 'INAPP', 'تم قبول طلبكم', 'تم قبول طلبكم {{request_number}}. المدة المتوقعة للإنجاز: {{estimated_days}} يوم عمل، والتاريخ المتوقع: {{expected_date}}.', 1, 1792875969687, 1792875969687);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x3002xqdpgumqb4x9k', 'cmvmw07pb0017qdpg10ffanv7', 'ACCEPTED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم قبول طلبكم {{request_number}} ({{service_name}}). المدة المتوقعة {{estimated_days}} يوم عمل — التسليم المتوقع: {{expected_date}}', 1, 1792875969688, 1792875969688);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x4002zqdpgonn13309', 'cmvmw07pb0017qdpg10ffanv7', 'REJECTED', 'INAPP', 'تم رفض الطلب', 'نعتذر، تم رفض طلبكم {{request_number}} للسبب التالي: {{reason}}', 1, 1792875969688, 1792875969688);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x50031qdpg0oqlwmpb', 'cmvmw07pb0017qdpg10ffanv7', 'STAGE_CHANGE', 'INAPP', 'تحديث حالة الطلب', 'طلبكم {{request_number}} انتقل إلى مرحلة: {{stage_name}}.', 1, 1792875969689, 1792875969689);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x60033qdpg8e10xpfp', 'cmvmw07pb0017qdpg10ffanv7', 'STAGE_CHANGE', 'WHATSAPP', NULL, 'تحديث طلبكم {{request_number}}: {{stage_name}} — {{track_link}}', 1, 1792875969691, 1792875969691);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27x70035qdpgw5sqioye', 'cmvmw07pb0017qdpg10ffanv7', 'COMPLETED', 'INAPP', 'اكتملت معاملتكم 🎉', 'اكتمل تنفيذ طلبكم {{request_number}} ({{service_name}}). المستندات النهائية متاحة عبر رابط التتبع: {{track_link}}', 1, 1792875969692, 1792875969692);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27xa0037qdpg0ft8f4u7', 'cmvmw07pb0017qdpg10ffanv7', 'COMPLETED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، اكتملت معاملتكم {{request_number}} ✅ المستندات النهائية وتفاصيل الاستلام: {{track_link}}', 1, 1792875969695, 1792875969695);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27xd0039qdpg1dqxqoqd', 'cmvmw07pb0017qdpg10ffanv7', 'COMPLETED', 'EMAIL', 'اكتمال المعاملة {{request_number}}', 'عميلنا الكريم {{client_name}}،
يسرنا إبلاغكم باكتمال معاملتكم {{request_number}} لخدمة {{service_name}}.
يمكنكم تحميل المستندات النهائية وتفاصيل الاستلام عبر: {{track_link}}
شكراً لثقتكم.', 1, 1792875969697, 1792875969697);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27xi003bqdpgf793mdgx', 'cmvmw07pb0017qdpg10ffanv7', 'ASSIGNED', 'INAPP', 'تكليف بطلب جديد', 'تم إسناد الطلب {{request_number}} إليكم.', 1, 1792875969702, 1792875969702);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27xj003dqdpgww6tfsli', 'cmvmw07pb0017qdpg10ffanv7', 'DELAYED', 'INAPP', 'تأخر عن المدة المتوقعة', 'الطلب {{request_number}} تجاوز التاريخ المتوقع للإنجاز {{expected_date}}.', 1, 1792875969704, 1792875969704);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvmw27xk003fqdpgu05vfiqu', 'cmvmw07pb0017qdpg10ffanv7', 'PAYMENT_DUE', 'INAPP', 'استحقاق دفعة', 'الطلب {{request_number}}: المتبقي المستحق {{remaining}}.', 1, 1792875969705, 1792875969705);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkd000rrix36sz82fyp', 'cmvo8wh6w000frix3hjatqzed', 'NEW_REQUEST', 'INAPP', 'طلب جديد وارد', 'ورد طلب جديد {{request_number}} من العميل {{client_name}} لخدمة {{service_name}}.', 1, 1792958248381, 1792958248381);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qke000trix31gfqy2hv', 'cmvo8wh6w000frix3hjatqzed', 'NEW_REQUEST', 'EMAIL', 'طلب جديد {{request_number}}', 'عميلنا الكريم {{client_name}}،
تم استلام طلبكم رقم {{request_number}} لخدمة {{service_name}} وسيبدأ فريقنا بمراجعته فوراً.
رابط التتبع: {{track_link}}', 1, 1792958248382, 1792958248382);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkf000vrix31718e8nl', 'cmvo8wh6w000frix3hjatqzed', 'NEW_REQUEST', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم استلام طلبكم {{request_number}} ({{service_name}}). تابعوه عبر: {{track_link}}', 1, 1792958248384, 1792958248384);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkg000xrix3lcvty1ho', 'cmvo8wh6w000frix3hjatqzed', 'MISSING_DOCS', 'INAPP', 'استكمال مستندات ناقصة', 'طلبكم {{request_number}} بحاجة إلى استكمال المستندات التالية: {{missing_docs}}. الموعد النهائي: {{deadline}}', 1, 1792958248385, 1792958248385);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkh000zrix39iuw6lso', 'cmvo8wh6w000frix3hjatqzed', 'MISSING_DOCS', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، لاستكمال طلبكم {{request_number}} يلزم رفع: {{missing_docs}} قبل {{deadline}}. ارفعوها من: {{track_link}}', 1, 1792958248386, 1792958248386);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qki0011rix3mqxddaqe', 'cmvo8wh6w000frix3hjatqzed', 'ACCEPTED', 'INAPP', 'تم قبول طلبكم', 'تم قبول طلبكم {{request_number}}. المدة المتوقعة للإنجاز: {{estimated_days}} يوم عمل، والتاريخ المتوقع: {{expected_date}}.', 1, 1792958248387, 1792958248387);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkj0013rix3qocupb8j', 'cmvo8wh6w000frix3hjatqzed', 'ACCEPTED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، تم قبول طلبكم {{request_number}} ({{service_name}}). المدة المتوقعة {{estimated_days}} يوم عمل — التسليم المتوقع: {{expected_date}}', 1, 1792958248387, 1792958248387);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkk0015rix38r17u66t', 'cmvo8wh6w000frix3hjatqzed', 'REJECTED', 'INAPP', 'تم رفض الطلب', 'نعتذر، تم رفض طلبكم {{request_number}} للسبب التالي: {{reason}}', 1, 1792958248389, 1792958248389);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkl0017rix352e7pjkw', 'cmvo8wh6w000frix3hjatqzed', 'STAGE_CHANGE', 'INAPP', 'تحديث حالة الطلب', 'طلبكم {{request_number}} انتقل إلى مرحلة: {{stage_name}}.', 1, 1792958248390, 1792958248390);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkm0019rix3pggdc36j', 'cmvo8wh6w000frix3hjatqzed', 'STAGE_CHANGE', 'WHATSAPP', NULL, 'تحديث طلبكم {{request_number}}: {{stage_name}} — {{track_link}}', 1, 1792958248391, 1792958248391);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkn001brix3h4wk42ks', 'cmvo8wh6w000frix3hjatqzed', 'COMPLETED', 'INAPP', 'اكتملت معاملتكم 🎉', 'اكتمل تنفيذ طلبكم {{request_number}} ({{service_name}}). المستندات النهائية متاحة عبر رابط التتبع: {{track_link}}', 1, 1792958248392, 1792958248392);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qko001drix39gw8m4wc', 'cmvo8wh6w000frix3hjatqzed', 'COMPLETED', 'WHATSAPP', NULL, 'عميلنا الكريم {{client_name}}، اكتملت معاملتكم {{request_number}} ✅ المستندات النهائية وتفاصيل الاستلام: {{track_link}}', 1, 1792958248392, 1792958248392);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkp001frix3bi9lox3o', 'cmvo8wh6w000frix3hjatqzed', 'COMPLETED', 'EMAIL', 'اكتمال المعاملة {{request_number}}', 'عميلنا الكريم {{client_name}}،
يسرنا إبلاغكم باكتمال معاملتكم {{request_number}} لخدمة {{service_name}}.
يمكنكم تحميل المستندات النهائية وتفاصيل الاستلام عبر: {{track_link}}
شكراً لثقتكم.', 1, 1792958248393, 1792958248393);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkp001hrix37lagxqs1', 'cmvo8wh6w000frix3hjatqzed', 'ASSIGNED', 'INAPP', 'تكليف بطلب جديد', 'تم إسناد الطلب {{request_number}} إليكم.', 1, 1792958248394, 1792958248394);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkq001jrix3vo9tokpt', 'cmvo8wh6w000frix3hjatqzed', 'DELAYED', 'INAPP', 'تأخر عن المدة المتوقعة', 'الطلب {{request_number}} تجاوز التاريخ المتوقع للإنجاز {{expected_date}}.', 1, 1792958248395, 1792958248395);
INSERT INTO "NotificationTemplate" ("id", "officeId", "event", "channel", "subject", "body", "isActive", "createdAt", "updatedAt") VALUES ('cmvo91qkr001lrix36okg3we8', 'cmvo8wh6w000frix3hjatqzed', 'PAYMENT_DUE', 'INAPP', 'استحقاق دفعة', 'الطلب {{request_number}}: المتبقي المستحق {{remaining}}.', 1, 1792958248395, 1792958248395);
INSERT INTO "Office" ("id", "name", "slug", "logoPath", "activityType", "phone", "whatsapp", "email", "address", "city", "managerName", "brandColor", "workingHours", "about", "holidays", "status", "reqCounter", "storageUsedMb", "createdAt", "updatedAt") VALUES ('cmvmtjy0d001eqdb7sgxbh70e', 'مكتب البحر الأحمر للتخليص الجمركي', 'red-sea', NULL, 'CLEARANCE', '+967 77 123 4567', '+967 77 123 4567', 'info@redsea-clearance.ye', 'عدن - كريتر - الشارع العام', 'عدن', 'أحمد عبدالله', '#0F766E', 'السبت - الخميس: 8 صباحاً - 4 عصراً', 'مكتب مخلص جمركي معتمد بخبرة تفوق 15 عاماً في تخليص البضائع عبر ميناء عدن والمنافذ البرية. نقدم خدمات التدقيق المستندي، التصنيف الجمركي، ومتابعة الإفراج النهائي باحترافية وسرعة.', NULL, 'ACTIVE', 7, 0, 1792871757805, 1792953699605);
INSERT INTO "Office" ("id", "name", "slug", "logoPath", "activityType", "phone", "whatsapp", "email", "address", "city", "managerName", "brandColor", "workingHours", "about", "holidays", "status", "reqCounter", "storageUsedMb", "createdAt", "updatedAt") VALUES ('cmvmw07pb0017qdpg10ffanv7', 'مكتب عدن التجاري للتخليص', 'aden-trade', NULL, 'CLEARANCE', NULL, NULL, 'manager@adentrade.ye', NULL, NULL, 'محمد الشميري', '#0F766E', NULL, NULL, NULL, 'ACTIVE', 0, 0, 1792875876095, 1793124967312);
INSERT INTO "Office" ("id", "name", "slug", "logoPath", "activityType", "phone", "whatsapp", "email", "address", "city", "managerName", "brandColor", "workingHours", "about", "holidays", "status", "reqCounter", "storageUsedMb", "createdAt", "updatedAt") VALUES ('cmvo8wh6w000frix3hjatqzed', 'بن خليل للسفريات و السياحة و  الخدمات اللوجستية', 'benkalal-com', NULL, 'TRAVEL', '772210310', NULL, 'supportaldalal@gmail.com', NULL, 'عدن', 'بن خليل', '#0F766E', NULL, NULL, NULL, 'ACTIVE', 0, 0, 1792958002952, 1792961074558);
INSERT INTO "Payment" ("id", "officeId", "customerId", "requestId", "amount", "currency", "exchangeRate", "amountBase", "method", "reference", "note", "attachmentPath", "receivedByName", "createdAt") VALUES ('cmvmtjyc20075qdb75xws0rhg', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjybg0062qdb7pkc684zo', 'cmvmtjybw006vqdb7o2f5bm8f', 27000, 'YER', 1, 27000, 'CASH', 'CASH-0021', NULL, NULL, 'فاطمة المحاسب', 1792698958210);
INSERT INTO "Payment" ("id", "officeId", "customerId", "requestId", "amount", "currency", "exchangeRate", "amountBase", "method", "reference", "note", "attachmentPath", "receivedByName", "createdAt") VALUES ('cmvqymwjl0028ptuyz3m4qq0g', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvo649ap000drio1ru74ugxe', NULL, 8000, 'SAR', 424, 3392000, 'CASH', NULL, NULL, NULL, 'أحمد عبدالله', 1793122158658);
INSERT INTO "Plan" ("id", "name", "description", "maxUsers", "maxStorageMb", "maxMonthlyReqs", "whatsappEnabled", "priceMonthly", "priceYearly", "isDefault", "isActive", "createdAt") VALUES ('cmvmtjxz20001qdb7u9rj0nyb', 'الأساسية', 'للمكاتب الصغيرة والناشئة', 3, 1024, 50, 0, 35, 350, 1, 1, 1792871757758);
INSERT INTO "Plan" ("id", "name", "description", "maxUsers", "maxStorageMb", "maxMonthlyReqs", "whatsappEnabled", "priceMonthly", "priceYearly", "isDefault", "isActive", "createdAt") VALUES ('cmvmtjxz40002qdb78vjgmhr3', 'الاحترافية', 'للمكاتب النشطة في التخليص', 8, 5120, 300, 1, 75, 750, 0, 1, 1792871757760);
INSERT INTO "Plan" ("id", "name", "description", "maxUsers", "maxStorageMb", "maxMonthlyReqs", "whatsappEnabled", "priceMonthly", "priceYearly", "isDefault", "isActive", "createdAt") VALUES ('cmvmtjxz50003qdb7u0m885xj', 'الأعمال', 'للمكاتب الكبيرة متعددة الفروع', 100, 20480, 2000, 1, 100000, 1500, 0, 1, 1792871757761);
INSERT INTO "PlatformSetting" ("id", "key", "value", "updatedAt") VALUES ('cmvmtjycz008gqdb7uj90x35k', 'platform_name', 'منصة مراسي', 1792871758259);
INSERT INTO "PlatformSetting" ("id", "key", "value", "updatedAt") VALUES ('cmvmtjyd0008hqdb7zspno3n7', 'platform_tagline', 'منصة إدارة مكاتب السفر والتخليص الجمركي', 1792871758260);
INSERT INTO "PlatformSetting" ("id", "key", "value", "updatedAt") VALUES ('cmvmtjyd0008iqdb74ul7e0xc', 'email_provider', 'محاكاة (سجل الإرسال) — جاهز للربط بمزود SMTP', 1792871758261);
INSERT INTO "PlatformSetting" ("id", "key", "value", "updatedAt") VALUES ('cmvmtjyd1008jqdb7r6iovj3d', 'whatsapp_provider', 'محاكاة (سجل الإرسال) — جاهز للربط بـ WhatsApp Business API', 1792871758262);
INSERT INTO "PlatformSetting" ("id", "key", "value", "updatedAt") VALUES ('cmvmtjyd2008kqdb7nbh4vztv', 'backup_daily', 'مفعّل', 1792871758262);
INSERT INTO "RegulatoryStep" ("id", "shipmentId", "type", "title", "scheduledAt", "result", "notes", "attachmentPath", "status", "createdAt", "updatedAt") VALUES ('cmvmtjybs006kqdb7w8zc6bmt', 'cmvmtjybs006gqdb7f1oanzlf', 'DECLARATION', 'فتح البيان الجمركي رقم ADN-2026-45231', 1792439758210, 'PASS', 'تم الفتح بنجاح', NULL, 'DONE', 1792871758216, 1792871758216);
INSERT INTO "RegulatoryStep" ("id", "shipmentId", "type", "title", "scheduledAt", "result", "notes", "attachmentPath", "status", "createdAt", "updatedAt") VALUES ('cmvmtjybs006lqdb7nxz9xnf6', 'cmvmtjybs006gqdb7f1oanzlf', 'INSPECTION', 'لجنة الكشف والمعاينة — ميناء عدن', 1792612558210, 'PASS', 'لا توجد ملاحظات، البضاعة مطابقة', NULL, 'DONE', 1792871758216, 1792871758216);
INSERT INTO "RegulatoryStep" ("id", "shipmentId", "type", "title", "scheduledAt", "result", "notes", "attachmentPath", "status", "createdAt", "updatedAt") VALUES ('cmvmtjybs006mqdb7lzanxyw7', 'cmvmtjybs006gqdb7f1oanzlf', 'STANDARDS', 'فحص هيئة المواصفات — الأرز والسكر', 1792958158210, NULL, 'بانتظار نتيجة المختبر', NULL, 'PENDING', 1792871758216, 1792871758216);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', 'RED-2026-0001', 'cmvmtjybg0062qdb7pkc684zo', 'cmvmtjy8i001uqdb7enu5j3lc', 'IN_PROGRESS', 'cmvmtjy8i0025qdb7920oyj1f', '069b62ca8e5222248c09620f124266ca', '{"bl_number":"MSCU-2026-118342","container_no":"MSCU1234567","goods_desc":"مواد غذائية متنوعة: أرز بسمتي، سكر، زيت طعام","supplier":"Golden Rice Trading Co.","origin":"الهند","arrival_date":"2026-10-17"}', 7, 1792353358210, 1793130958210, NULL, NULL, NULL, NULL, NULL, 'YER', NULL, 'cmvmtjy6e001oqdb7xeiqpxqf', NULL, 1792180558210, 1792871758213);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmtjybw006vqdb7o2f5bm8f', 'cmvmtjy0d001eqdb7sgxbh70e', 'RED-2026-0002', 'cmvmtjybg0062qdb7pkc684zo', 'cmvmtjy8w004iqdb7k2jc2m58', 'DELIVERED', 'cmvmtjy8w004qqdb7srogut2k', '59e9468773dae6bab28692f3dac71bf0', '{"tax_number":"3001234567","owner_name":"شركة النور للتجارة"}', 3, 1792353358210, 1792785358210, 1792785358210, 1792871758210, NULL, NULL, 1792785358210, 'YER', 5, NULL, NULL, 1792180558210, 1792871758220);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmtjyc60079qdb7chtfplmj', 'cmvmtjy0d001eqdb7sgxbh70e', 'RED-2026-0003', 'cmvmtjybi0064qdb7a5mn43o0', 'cmvmtjy8n0034qdb7yh7beu46', 'IN_PROGRESS', 'cmvmtjy8o003eqdb7b8ghjq2g', '8e6409caba4568b94c3181b7001ffc0e', '{"bl_number":"AWB-116-88213455","goods_desc":"قطع غيار سيارات متنوعة","weight":"1200"}', 8, 1793121318724, 1794158118724, NULL, NULL, NULL, 1793135331912, NULL, 'YER', NULL, 'cmvmtjy4e001mqdb7wckj46o8', NULL, 1792180558210, 1793121356759);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmtjycb007hqdb7036rnr4u', 'cmvmtjy0d001eqdb7sgxbh70e', 'RED-2026-0004', 'cmvmtjybj0066qdb7j1903e7h', 'cmvmtjy8q003oqdb7hcqjo0ny', 'SUBMITTED', NULL, 'ea337185dc3ac3c96bd6a537b1e77755', '{"goods_desc":"أجهزة تكييف سبليت 1.5 طن","hs_code":"841581"}', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'YER', NULL, NULL, NULL, 1792180558210, 1792871758235);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmtjyci007pqdb7cfrob58x', 'cmvmtjy0d001eqdb7sgxbh70e', 'RED-2026-0005', 'cmvmtjybj0066qdb7j1903e7h', 'cmvmtjy8i001uqdb7enu5j3lc', 'ACCEPTED', 'cmvmtjy8i0022qdb7vp5w5oly', '936db0e7675ed96c598118bcab4536f3', '{"bl_number":"CMAU-2026-77120","container_no":"CMAU7712330","goods_desc":"مواد بناء: أسمنت وألواح","supplier":"Building Materials Co.","origin":"الإمارات"}', 7, 1792353358210, 1793130958210, NULL, NULL, NULL, NULL, NULL, 'YER', NULL, NULL, 'cmvmtjy4e001mqdb7wckj46o8', 1792180558210, 1792871758242);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'REDS-2026-0006', 'cmvmtjybg0062qdb7pkc684zo', 'cmvmtjy8i001uqdb7enu5j3lc', 'IN_PROGRESS', 'cmvmtjy8i0022qdb7vp5w5oly', '734228fd862761a77328b4c64d80ef70', '{"bl_number":"MSCU-2026-999888","container_no":"MSCU9998887","goods_desc":"أرز بسمتي هندي فاخر - شحنة اختبار شامل","supplier":"Test Supplier Co.","origin":"الهند"}', 7, 1792875717238, 1793653317238, NULL, NULL, NULL, NULL, NULL, 'YER', NULL, NULL, NULL, 1792875640297, 1792875813715);
INSERT INTO "Request" ("id", "officeId", "requestNumber", "customerId", "serviceId", "status", "currentStageId", "trackingCode", "formData", "estimatedDays", "acceptedAt", "expectedCompletion", "completedAt", "deliveredAt", "rejectedReason", "missingDeadline", "completionNotified", "currency", "rating", "assignedToId", "createdByStaffId", "createdAt", "updatedAt") VALUES ('cmvo6c8pi000hrio13huh64v2', 'cmvmtjy0d001eqdb7sgxbh70e', 'REDS-2026-0007', 'cmvo649ap000drio1ru74ugxe', 'cmvmtjy8y004uqdb753ypustf', 'SUBMITTED', NULL, '554de48d13da4f25ff42e71a0e8fd29b', '{"activity":"استيراد ادوات الكترونية","entity_name":"المبرزي للتجارة"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'YER', NULL, NULL, NULL, 1792953699607, 1792953699607);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycm007zqdb7orqeaht3', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'الفاتورة التجارية', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758246, 1792871758246);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycn0081qdb703cc97dp', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'بوليصة الشحن', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758248, 1792871758248);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycp0083qdb76l9h4raa', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'قائمة التعبئة', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758250, 1792871758250);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycq0085qdb73l7ncgsa', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'شهادة المنشأ', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758250, 1792871758250);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycs0087qdb7scfzxc60', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'إذن التسليم', NULL, NULL, NULL, NULL, 1, 'UPLOADED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758253, 1792871758253);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycv0089qdb7dbphzx0a', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'السجل التجاري للمستورد', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758255, 1792871758255);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycw008bqdb7licieags', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'البطاقة الضريبية للمستورد', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758256, 1792871758256);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycx008dqdb7k56tildl', 'cmvmtjybw006vqdb7o2f5bm8f', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'صورة البطاقة الضريبية الحالية', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758258, 1792871758258);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmtjycy008fqdb7fnqbucfd', 'cmvmtjybw006vqdb7o2f5bm8f', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'السجل التجاري ساري المفعول', NULL, NULL, NULL, NULL, 1, 'APPROVED', NULL, 'CUSTOMER', 'بوابة العميل', 1792871758258, 1792871758258);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5rh0007qdpgkmuhk47o', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i001vqdb7bu8q1u3k', 'الفاتورة التجارية', 'invoice.pdf', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/1dd41e851eb30bde8f2c6fed.pdf', 220, 'application/pdf', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640301, 1792875640301);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5rp0009qdpg7o8de2yj', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i001wqdb7me7tzap2', 'بوليصة الشحن', 'bl.jpg', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/7c974c5488fd31d0cadf5b32.jpg', 160, 'image/jpeg', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640309, 1792875640309);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5rt000bqdpg0z6bz2ho', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i001xqdb7tuup1zgg', 'قائمة التعبئة', 'packing.jpg', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/ff2e19d10c49992a9247adf1.jpg', 160, 'image/jpeg', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640313, 1792875640313);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5rv000dqdpgg03kzvpw', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i001yqdb7xdnhfemr', 'شهادة المنشأ', 'origin.jpg', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/a60139cba23723681b881aa0.jpg', 160, 'image/jpeg', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640315, 1792875640315);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5rx000fqdpgaaet3vgm', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i0020qdb7ynekawjw', 'السجل التجاري للمستورد', 'cr.jpg', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/2bdaa97e09f80c406beda8d3.jpg', 160, 'image/jpeg', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640318, 1792875640318);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmvv5s0000hqdpgqmwbc1o0', 'cmvmvv5rd0005qdpgz780bmxf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8i0021qdb7ha4lmkdy', 'البطاقة الضريبية للمستورد', 'tax.jpg', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmvv5rd0005qdpgz780bmxf/4cbce8382fd1d815ad4d836e.jpg', 160, 'image/jpeg', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640320, 1792875640320);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmw5p3e0005qd9wsm4sodwh', 'cmvmtjyc60079qdb7chtfplmj', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'الفاتورة التجارية', NULL, NULL, NULL, NULL, 1, 'MISSING', NULL, 'STAFF', 'سارة حسن', 1792876131914, 1792876131914);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmw5p3h0007qd9wkf19oazw', 'cmvmtjyc60079qdb7chtfplmj', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'بوليصة الشحن', NULL, NULL, NULL, NULL, 1, 'MISSING', NULL, 'STAFF', 'سارة حسن', 1792876131917, 1792876131917);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvmw7yra000nqd9wvq76gyf5', 'cmvmtjyc60079qdb7chtfplmj', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'الفاتورة التجارية', 'invoice.pdf', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvmtjyc60079qdb7chtfplmj/93992f939b547a5ed411e236.pdf', 220, 'application/pdf', 2, 'UPLOADED', NULL, 'CUSTOMER', 'محمد سالم باعوم', 1792876237750, 1792876237750);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvo6c8po000jrio181qr5psm', 'cmvo6c8pi000hrio13huh64v2', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8y004vqdb7lv779r5k', 'صورة هوية المالك', 'Screenshot (3).png', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvo6c8pi000hrio13huh64v2/36f0ed3748430b7a8a66250e.png', 367458, 'image/png', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة المبزي للتجارة و الاستيراد', 1792953699612, 1792953699612);
INSERT INTO "RequestDocument" ("id", "requestId", "officeId", "requiredDocId", "name", "fileName", "filePath", "fileSize", "mimeType", "version", "status", "reviewNote", "uploadedByType", "uploadedByName", "createdAt", "updatedAt") VALUES ('cmvo6c8pr000lrio1jmnhc7c7', 'cmvo6c8pi000hrio13huh64v2', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8y004xqdb7sieuf4el', 'عقد الإيجار أو ملكية المحل', 'Screenshot (3).png', 'cmvmtjy0d001eqdb7sgxbh70e/requests/cmvo6c8pi000hrio13huh64v2/1debca0a34e09ba62d3d6683.png', 367458, 'image/png', 1, 'UPLOADED', NULL, 'CUSTOMER', 'شركة المبزي للتجارة و الاستيراد', 1792953699615, 1792953699615);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjybp006aqdb76kchlr92', 'cmvmtjybo0068qdb70gzu388m', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjybq006cqdb79z76l0eh', 'cmvmtjybo0068qdb70gzu388m', 'SUBMITTED', 'UNDER_REVIEW', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjybq006eqdb7mows2nml', 'cmvmtjybo0068qdb70gzu388m', 'UNDER_REVIEW', 'IN_PROGRESS', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjybx006xqdb748i3mhi7', 'cmvmtjybw006vqdb7o2f5bm8f', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjybz006zqdb7kw313n4j', 'cmvmtjybw006vqdb7o2f5bm8f', 'SUBMITTED', 'UNDER_REVIEW', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyc00071qdb73h4fkal2', 'cmvmtjybw006vqdb7o2f5bm8f', 'UNDER_REVIEW', 'DELIVERED', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyc7007bqdb7dhmearnr', 'cmvmtjyc60079qdb7chtfplmj', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyc8007dqdb7vilvc0bu', 'cmvmtjyc60079qdb7chtfplmj', 'SUBMITTED', 'UNDER_REVIEW', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyc8007fqdb70bfbqbvg', 'cmvmtjyc60079qdb7chtfplmj', 'UNDER_REVIEW', 'AWAITING_CLIENT', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjycc007jqdb7b5ovt2j2', 'cmvmtjycb007hqdb7036rnr4u', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyce007lqdb7juks5nno', 'cmvmtjycb007hqdb7036rnr4u', 'SUBMITTED', 'UNDER_REVIEW', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjycf007nqdb7ojxcw2r6', 'cmvmtjycb007hqdb7036rnr4u', 'UNDER_REVIEW', 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyci007rqdb7zk0zfga4', 'cmvmtjyci007pqdb7cfrob58x', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من قبل العميل', 1, NULL, 'CUSTOMER', 'بوابة العميل', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjycj007tqdb7wtn3ackc', 'cmvmtjyci007pqdb7cfrob58x', 'SUBMITTED', 'UNDER_REVIEW', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmtjyck007vqdb7psab61mj', 'cmvmtjyci007pqdb7cfrob58x', 'UNDER_REVIEW', 'ACCEPTED', NULL, NULL, NULL, 1, NULL, 'STAFF', 'سارة حسن', 1792180558210);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmvv5s1000jqdpgqe6fts90', 'cmvmvv5rd0005qdpgz780bmxf', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من بوابة العميل', 1, NULL, 'CUSTOMER', 'شركة النور للتجارة والاستيراد', 1792875640322);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmvwtle000sqdpgdcs6yip6', 'cmvmvv5rd0005qdpgz780bmxf', 'SUBMITTED', 'ACCEPTED', NULL, NULL, 'تم قبول الطلب — المدة المتوقعة 7 يوم عمل', 1, NULL, 'STAFF', 'أحمد عبدالله', 1792875717843);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmvyvkl000wqdpg310b2jbi', 'cmvmvv5rd0005qdpgz780bmxf', 'ACCEPTED', 'IN_PROGRESS', 'cmvmtjy8i0022qdb7vp5w5oly', 'قيد التدقيق المستندي', NULL, 1, NULL, 'STAFF', 'أحمد عبدالله', 1792875813717);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmw5p4b000fqd9wvx8q3g3m', 'cmvmtjyc60079qdb7chtfplmj', 'AWAITING_CLIENT', 'AWAITING_CLIENT', NULL, NULL, 'طلب استكمال: الفاتورة التجارية، بوليصة الشحن', 1, NULL, 'STAFF', 'سارة حسن', 1792876131947);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvmw7yrd000pqd9wev0mu4rn', 'cmvmtjyc60079qdb7chtfplmj', 'AWAITING_CLIENT', 'UNDER_REVIEW', NULL, NULL, 'رفع العميل مستنداً: الفاتورة التجارية — عاد الطلب للمراجعة', 1, NULL, 'CUSTOMER', 'محمد سالم باعوم', 1792876237754);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvo6c8ps000nrio1n0ic6h9l', 'cmvo6c8pi000hrio13huh64v2', NULL, 'SUBMITTED', NULL, NULL, 'تم إرسال الطلب من بوابة العميل', 1, NULL, 'CUSTOMER', 'شركة المبزي للتجارة و الاستيراد', 1792953699617);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvqy4wgg000tptuyo32uzxdh', 'cmvmtjyc60079qdb7chtfplmj', 'UNDER_REVIEW', 'ACCEPTED', NULL, NULL, 'تم قبول الطلب — المدة المتوقعة 8 يوم عمل', 1, NULL, 'STAFF', 'أحمد عبدالله', 1793121318736);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvqy5oyc000xptuywv8j299d', 'cmvmtjyc60079qdb7chtfplmj', 'ACCEPTED', 'IN_PROGRESS', 'cmvmtjy8o003eqdb7b8ghjq2g', 'فتح البيان الجمركي', '8978', 1, NULL, 'STAFF', 'أحمد عبدالله', 1793121355669);
INSERT INTO "RequestStatusHistory" ("id", "requestId", "fromStatus", "toStatus", "stageId", "stageName", "note", "isVisible", "attachmentPath", "actorType", "actorName", "createdAt") VALUES ('cmvqy5pso0017ptuygyunf8yr', 'cmvmtjyc60079qdb7chtfplmj', 'IN_PROGRESS', 'IN_PROGRESS', 'cmvmtjy8o003eqdb7b8ghjq2g', 'فتح البيان الجمركي', '8978', 1, NULL, 'STAFF', 'أحمد عبدالله', 1793121356761);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8i001uqdb7enu5j3lc', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'تخليص حاوية 20 قدم', 'خدمة التخليص الجمركي الكاملة لحاوية 20 قدماً من ميناء عدن أو المنافذ، تشمل التدقيق المستندي والتصنيف والبيان الجمركي والمعاينة والإفراج.', 'container', NULL, 'حسب الطلب', 'YER', 7, 1, 1, 0, 1792871758098, 1792871758098);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8k002hqdb7ne7zth4w', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'تخليص حاوية 40 قدم', 'خدمة التخليص الجمركي الكاملة لحاوية 40 قدماً من ميناء عدن أو المنافذ البرية.', 'container', NULL, 'حسب الطلب', 'YER', 8, 1, 1, 0, 1792871758100, 1792871758100);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8n0034qdb7yh7beu46', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'تخليص بضائع عامة (LCL)', 'تخليص البضائع المجمعة والشحنات الجزئية من ميناء عدن أو المطارات.', 'package', NULL, 'حسب الطلب', 'YER', 6, 1, 1, 0, 1792871758104, 1792871758104);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8q003oqdb7hcqjo0ny', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'فحص مطابقة المواصفات والمقاييس', 'إجراءات الفحص ومطابقة المواصفات لدى هيئة المواصفات والمقاييس ومعالجة القيود الفنية.', 'shield-check', NULL, 'حسب الطلب', 'YER', 5, 1, 1, 0, 1792871758106, 1792871758106);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8s0040qdb7etx85pdq', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'ترانزيت (عبور)', 'إجراءات الترانزيت والعبور للبضائع العابرة عبر المنافذ اليمنية.', 'route', NULL, 'حسب الطلب', 'YER', 4, 1, 1, 0, 1792871758108, 1792871758108);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8w004iqdb7k2jc2m58', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8v004gqdb7m6h45q5j', 'تجديد البطاقة الضريبية', 'تجديد البطاقة الضريبية لدى مصلحة الضرائب – فرع عدن، مع متابعة كافة المراحل حتى الاستلام.', 'receipt', 15000, NULL, 'YER', 3, 0, 1, 0, 1792871758112, 1792871758112);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvmtjy8y004uqdb753ypustf', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8v004gqdb7m6h45q5j', 'استخراج / تجديد السجل التجاري', 'إجراءات استخراج أو تجديد السجل التجاري لدى وزارة الصناعة والتجارة.', 'file-badge', 20000, NULL, 'YER', 5, 0, 1, 0, 1792871758114, 1792871758114);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvo9oihs0021rix31f9yw3vm', 'cmvo8wh6w000frix3hjatqzed', 'cmvo9oihq001zrix3qzvtzfne', 'تذاكر طيران دولية', 'حجز وإصدار تذاكر الطيران لأفضل المسارات والأسعار، مع إمكانية التغيير والاسترجاع وفق أنظمة شركات الطيران.', 'plane', NULL, 'حسب الوجهة والموسم', 'YER', 2, 0, 1, 0, 1792959311008, 1792959311008);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvo9os2h002jrix3t9321igt', 'cmvo8wh6w000frix3hjatqzed', 'cmvo9os2f002hrix3qr3xooc8', 'حزمة العمرة', 'باقة عمرة متكاملة: التأشيرة وتذاكر الطيران والإقامة والتنقل بين المشاعر مع إشراف متفرغ طوال الرحلة.', 'umrah', NULL, 'حسب الباقة والموسم', 'YER', 14, 0, 1, 0, 1792959323418, 1792959323418);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvo9oyg50031rix3mnwcejc5', 'cmvo8wh6w000frix3hjatqzed', 'cmvo9oihq001zrix3qzvtzfne', 'حجز فنادق', 'حجز غرف الفنادق والشقق الفندقية حول العالم بأسعار تفضيلية مع قسيمة إقامة مؤكدة.', 'hotel', NULL, 'حسب المدينة والفندق', 'YER', 1, 0, 1, 0, 1792959331685, 1792959331685);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvo9pajn003jrix32lkga7ai', 'cmvo8wh6w000frix3hjatqzed', 'cmvo9pajl003hrix3zrh5a96k', 'تأشيرة سياحية', 'تجهيز ملف طلب التأشيرة السياحية كاملاً والتقديم لدى السفارات والقنصليات ومتابعة النتيجة حتى استلام الجواز.', 'visa', NULL, 'حسب الدولة ونوع التأشيرة', 'YER', 15, 0, 1, 0, 1792959347364, 1792959347364);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvoan6g5004qrix3j8vxtkke', 'cmvo8wh6w000frix3hjatqzed', 'cmvo9oihq001zrix3qzvtzfne', 'نقل بري وتوصيل المطار', 'تنظيم النقل البري بين المدن ومركبات توصيل من وإلى المطار مع سائق خاص', NULL, 35000, NULL, 'YER', 3, 0, 1, 4, 1792960928358, 1792960928358);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvobalrx005rrix33kwm7opd', 'cmvo8wh6w000frix3hjatqzed', NULL, 'تجديد ب', NULL, NULL, NULL, 'حسب الطلب', 'YER', 7, 1, 1, 5, 1792962021309, 1792962021309);
INSERT INTO "Service" ("id", "officeId", "categoryId", "name", "description", "icon", "price", "priceLabel", "currency", "estimatedDays", "isClearance", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ('cmvqygf0m001jptuy9najc16n', 'cmvmtjy0d001eqdb7sgxbh70e', 'cmvmtjy8g001sqdb7eihjhsg5', 'تخليص حاوية 40 قدم (نسخة)', 'خدمة التخليص الجمركي الكاملة لحاوية 40 قدماً من ميناء عدن أو المنافذ البرية.', 'container', NULL, 'حسب الطلب', 'YER', 8, 1, 1, 0, 1793121856006, 1793121856006);
INSERT INTO "ServiceCategory" ("id", "officeId", "name", "icon", "sortOrder", "isActive", "createdAt") VALUES ('cmvmtjy8g001sqdb7eihjhsg5', 'cmvmtjy0d001eqdb7sgxbh70e', 'التخليص الجمركي', NULL, 0, 1, 1792871758096);
INSERT INTO "ServiceCategory" ("id", "officeId", "name", "icon", "sortOrder", "isActive", "createdAt") VALUES ('cmvmtjy8v004gqdb7m6h45q5j', 'cmvmtjy0d001eqdb7sgxbh70e', 'وثائق تجارية وضريبية', NULL, 1, 1, 1792871758111);
INSERT INTO "ServiceCategory" ("id", "officeId", "name", "icon", "sortOrder", "isActive", "createdAt") VALUES ('cmvo9oihq001zrix3qzvtzfne', 'cmvo8wh6w000frix3hjatqzed', 'السفر والطيران', NULL, 0, 1, 1792959311006);
INSERT INTO "ServiceCategory" ("id", "officeId", "name", "icon", "sortOrder", "isActive", "createdAt") VALUES ('cmvo9os2f002hrix3qr3xooc8', 'cmvo8wh6w000frix3hjatqzed', 'الحج والعمرة', NULL, 1, 1, 1792959323416);
INSERT INTO "ServiceCategory" ("id", "officeId", "name", "icon", "sortOrder", "isActive", "createdAt") VALUES ('cmvo9pajl003hrix3zrh5a96k', 'cmvo8wh6w000frix3hjatqzed', 'التأشيرات', NULL, 2, 1, 1792959347362);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i001vqdb7bu8q1u3k', 'cmvmtjy8i001uqdb7enu5j3lc', 'الفاتورة التجارية', 'Invoice موقّعة من المورد', 1, 'PDF,JPG,PNG', 10, 0, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i001wqdb7me7tzap2', 'cmvmtjy8i001uqdb7enu5j3lc', 'بوليصة الشحن', 'Bill of Lading / Airway Bill', 1, 'PDF,JPG,PNG', 10, 1, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i001xqdb7tuup1zgg', 'cmvmtjy8i001uqdb7enu5j3lc', 'قائمة التعبئة', 'Packing List', 1, 'PDF,JPG,PNG', 10, 2, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i001yqdb7xdnhfemr', 'cmvmtjy8i001uqdb7enu5j3lc', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i001zqdb7ywpuzypz', 'cmvmtjy8i001uqdb7enu5j3lc', 'إذن التسليم', 'Delivery Order من وكيل الشحن', 0, 'PDF,JPG,PNG', 10, 4, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i0020qdb7ynekawjw', 'cmvmtjy8i001uqdb7enu5j3lc', 'السجل التجاري للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 5, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8i0021qdb7ha4lmkdy', 'cmvmtjy8i001uqdb7enu5j3lc', 'البطاقة الضريبية للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 6, 1792871758098);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002iqdb7wp72fwdl', 'cmvmtjy8k002hqdb7ne7zth4w', 'الفاتورة التجارية', 'Invoice موقّعة من المورد', 1, 'PDF,JPG,PNG', 10, 0, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002jqdb7mwhrc1yo', 'cmvmtjy8k002hqdb7ne7zth4w', 'بوليصة الشحن', 'Bill of Lading / Airway Bill', 1, 'PDF,JPG,PNG', 10, 1, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002kqdb7xwe4sq0e', 'cmvmtjy8k002hqdb7ne7zth4w', 'قائمة التعبئة', 'Packing List', 1, 'PDF,JPG,PNG', 10, 2, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002lqdb7y36qlt47', 'cmvmtjy8k002hqdb7ne7zth4w', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002mqdb7hsooppkc', 'cmvmtjy8k002hqdb7ne7zth4w', 'إذن التسليم', 'Delivery Order من وكيل الشحن', 0, 'PDF,JPG,PNG', 10, 4, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002nqdb75hqkd82m', 'cmvmtjy8k002hqdb7ne7zth4w', 'السجل التجاري للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 5, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8k002oqdb7s2xw8li7', 'cmvmtjy8k002hqdb7ne7zth4w', 'البطاقة الضريبية للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 6, 1792871758100);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8n0035qdb7x39048cj', 'cmvmtjy8n0034qdb7yh7beu46', 'الفاتورة التجارية', 'Invoice موقّعة من المورد', 1, 'PDF,JPG,PNG', 10, 0, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o0036qdb7vudkdzzu', 'cmvmtjy8n0034qdb7yh7beu46', 'بوليصة الشحن', 'Bill of Lading / Airway Bill', 1, 'PDF,JPG,PNG', 10, 1, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o0037qdb78uj4nx2z', 'cmvmtjy8n0034qdb7yh7beu46', 'قائمة التعبئة', 'Packing List', 1, 'PDF,JPG,PNG', 10, 2, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o0038qdb7hvba9d3l', 'cmvmtjy8n0034qdb7yh7beu46', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o0039qdb7idsezlhv', 'cmvmtjy8n0034qdb7yh7beu46', 'إذن التسليم', 'Delivery Order من وكيل الشحن', 0, 'PDF,JPG,PNG', 10, 4, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o003aqdb7xpj7vfux', 'cmvmtjy8n0034qdb7yh7beu46', 'السجل التجاري للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 5, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8o003bqdb7o543o2tx', 'cmvmtjy8n0034qdb7yh7beu46', 'البطاقة الضريبية للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 6, 1792871758104);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8q003pqdb75lvfq8ll', 'cmvmtjy8q003oqdb7hcqjo0ny', 'الفاتورة التجارية', NULL, 1, 'PDF,JPG,PNG', 10, 0, 1792871758106);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8q003qqdb7xiq0psmr', 'cmvmtjy8q003oqdb7hcqjo0ny', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 1, 1792871758106);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8q003rqdb7wpowbhga', 'cmvmtjy8q003oqdb7hcqjo0ny', 'شهادة المطابقة إن وجدت', NULL, 0, 'PDF,JPG,PNG', 10, 2, 1792871758106);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0041qdb7pliw79k9', 'cmvmtjy8s0040qdb7etx85pdq', 'الفاتورة التجارية', 'Invoice موقّعة من المورد', 1, 'PDF,JPG,PNG', 10, 0, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0042qdb7dl0b785q', 'cmvmtjy8s0040qdb7etx85pdq', 'بوليصة الشحن', 'Bill of Lading / Airway Bill', 1, 'PDF,JPG,PNG', 10, 1, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0043qdb7lxtncx5z', 'cmvmtjy8s0040qdb7etx85pdq', 'قائمة التعبئة', 'Packing List', 1, 'PDF,JPG,PNG', 10, 2, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0044qdb7pj69rra6', 'cmvmtjy8s0040qdb7etx85pdq', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0045qdb7c1zc5yiu', 'cmvmtjy8s0040qdb7etx85pdq', 'إذن التسليم', 'Delivery Order من وكيل الشحن', 0, 'PDF,JPG,PNG', 10, 4, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0046qdb7p72q5o47', 'cmvmtjy8s0040qdb7etx85pdq', 'السجل التجاري للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 5, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8s0047qdb7szph7ldd', 'cmvmtjy8s0040qdb7etx85pdq', 'البطاقة الضريبية للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 6, 1792871758108);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8w004jqdb7pvgxrdrk', 'cmvmtjy8w004iqdb7k2jc2m58', 'صورة البطاقة الضريبية الحالية', NULL, 1, 'PDF,JPG,PNG', 10, 0, 1792871758112);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8w004kqdb7keail343', 'cmvmtjy8w004iqdb7k2jc2m58', 'السجل التجاري ساري المفعول', NULL, 1, 'PDF,JPG,PNG', 10, 1, 1792871758112);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8w004lqdb7nsfnime3', 'cmvmtjy8w004iqdb7k2jc2m58', 'إقرار الدخل السنوي', NULL, 0, 'PDF,JPG,PNG', 10, 2, 1792871758112);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8y004vqdb7lv779r5k', 'cmvmtjy8y004uqdb753ypustf', 'صورة هوية المالك', NULL, 1, 'PDF,JPG,PNG', 10, 0, 1792871758114);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8y004wqdb7rtcebi7q', 'cmvmtjy8y004uqdb753ypustf', 'صورة السجل التجاري السابق (للتجديد)', NULL, 0, 'PDF,JPG,PNG', 10, 1, 1792871758114);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvmtjy8y004xqdb7sieuf4el', 'cmvmtjy8y004uqdb753ypustf', 'عقد الإيجار أو ملكية المحل', NULL, 1, 'PDF,JPG,PNG', 10, 2, 1792871758114);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9oihs0022rix3t5u4f3us', 'cmvo9oihs0021rix31f9yw3vm', 'جواز سفر ساري المفعول (6 أشهر)', 'صورة صفحة البيانات', 1, 'PDF,JPG,PNG', 10, 0, 1792959311008);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9os2h002krix3vc3erxke', 'cmvo9os2h002jrix3t9321igt', 'جواز سفر ساري المفعول (6 أشهر)', 'صورة صفحة البيانات', 1, 'PDF,JPG,PNG', 10, 0, 1792959323418);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9os2h002lrix3re4mkne8', 'cmvo9os2h002jrix3t9321igt', 'صورة شخصية بخلفية بيضاء', 'مقاس 4×6 حديثة', 1, 'PDF,JPG,PNG', 10, 1, 1792959323418);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9os2h002mrix3ug17uqt3', 'cmvo9os2h002jrix3t9321igt', 'شهادة التطعيم (حمى الوادي المتصدع)', NULL, 1, 'PDF,JPG,PNG', 10, 2, 1792959323418);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9os2h002nrix3xvy9nwo2', 'cmvo9os2h002jrix3t9321igt', 'تعريف عائلي للنساء المصطحبات (إن وجد)', NULL, 0, 'PDF,JPG,PNG', 10, 3, 1792959323418);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9oyg50032rix3h9q7f6rt', 'cmvo9oyg50031rix3mnwcejc5', 'جواز سفر ساري المفعول (6 أشهر)', 'صورة صفحة البيانات', 1, 'PDF,JPG,PNG', 10, 0, 1792959331685);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9pajn003krix3up9q4ha6', 'cmvo9pajn003jrix32lkga7ai', 'جواز سفر ساري المفعول (6 أشهر)', 'صورة صفحة البيانات', 1, 'PDF,JPG,PNG', 10, 0, 1792959347364);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9pajn003lrix349imzv7p', 'cmvo9pajn003jrix32lkga7ai', 'صورة شخصية بخلفية بيضاء', 'مقاس 4×6 حديثة', 1, 'PDF,JPG,PNG', 10, 1, 1792959347364);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9pajn003mrix38s102qcv', 'cmvo9pajn003jrix32lkga7ai', 'كشف حساب بنكي (آخر 6 أشهر)', NULL, 1, 'PDF,JPG,PNG', 10, 2, 1792959347364);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9pajo003nrix3c7mkr37y', 'cmvo9pajn003jrix32lkga7ai', 'تعريف بالعمل أو بالراتب', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1792959347364);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvo9pajo003orix3nvw8lsrk', 'cmvo9pajn003jrix32lkga7ai', 'حجز فندق وتذاكر ذهاب وعودة', NULL, 0, 'PDF,JPG,PNG', 10, 4, 1792959347364);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001kptuy5pqu1hfn', 'cmvqygf0m001jptuy9najc16n', 'الفاتورة التجارية', 'Invoice موقّعة من المورد', 1, 'PDF,JPG,PNG', 10, 0, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001lptuy5fgscu97', 'cmvqygf0m001jptuy9najc16n', 'بوليصة الشحن', 'Bill of Lading / Airway Bill', 1, 'PDF,JPG,PNG', 10, 1, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001mptuyqxa47v4v', 'cmvqygf0m001jptuy9najc16n', 'قائمة التعبئة', 'Packing List', 1, 'PDF,JPG,PNG', 10, 2, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001nptuyln81n94g', 'cmvqygf0m001jptuy9najc16n', 'شهادة المنشأ', NULL, 1, 'PDF,JPG,PNG', 10, 3, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001optuyoils5bvi', 'cmvqygf0m001jptuy9najc16n', 'إذن التسليم', 'Delivery Order من وكيل الشحن', 0, 'PDF,JPG,PNG', 10, 4, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001pptuy1czj2fx4', 'cmvqygf0m001jptuy9najc16n', 'السجل التجاري للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 5, 1793121856006);
INSERT INTO "ServiceRequiredDocument" ("id", "serviceId", "name", "description", "isMandatory", "allowedFormats", "maxSizeMb", "sortOrder", "createdAt") VALUES ('cmvqygf0m001qptuys23flqwi', 'cmvqygf0m001jptuy9najc16n', 'البطاقة الضريبية للمستورد', NULL, 1, 'PDF,JPG,PNG', 10, 6, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0022qdb7vp5w5oly', 'cmvmtjy8i001uqdb7enu5j3lc', 'قيد التدقيق المستندي', 0, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0023qdb7mlx2czdh', 'cmvmtjy8i001uqdb7enu5j3lc', 'تصنيف البضاعة (HS Code)', 1, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0024qdb7x1hb0ofi', 'cmvmtjy8i001uqdb7enu5j3lc', 'فتح البيان الجمركي', 2, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0025qdb7920oyj1f', 'cmvmtjy8i001uqdb7enu5j3lc', 'لجنة الكشف والمعاينة', 3, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0026qdb7pafluhax', 'cmvmtjy8i001uqdb7enu5j3lc', 'مطابقة المواصفات والقيود الفنية', 4, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0027qdb7p50n4cg3', 'cmvmtjy8i001uqdb7enu5j3lc', 'احتساب وسداد الرسوم والضرائب', 5, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0028qdb7kydp3d4m', 'cmvmtjy8i001uqdb7enu5j3lc', 'استخراج إذن الإفراج النهائي', 6, 1, 0, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8i0029qdb7czknz0it', 'cmvmtjy8i001uqdb7enu5j3lc', 'جاهز للاستلام / مكتمل', 7, 1, 1, 1792871758098);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002pqdb7982cxzfj', 'cmvmtjy8k002hqdb7ne7zth4w', 'قيد التدقيق المستندي', 0, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002qqdb7tm37bmx3', 'cmvmtjy8k002hqdb7ne7zth4w', 'تصنيف البضاعة (HS Code)', 1, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002rqdb72tcgpjtk', 'cmvmtjy8k002hqdb7ne7zth4w', 'فتح البيان الجمركي', 2, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002sqdb7lp8sy9y5', 'cmvmtjy8k002hqdb7ne7zth4w', 'لجنة الكشف والمعاينة', 3, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002tqdb7fi1z6gsk', 'cmvmtjy8k002hqdb7ne7zth4w', 'مطابقة المواصفات والقيود الفنية', 4, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002uqdb7x0he9e68', 'cmvmtjy8k002hqdb7ne7zth4w', 'احتساب وسداد الرسوم والضرائب', 5, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002vqdb7bfcht3hg', 'cmvmtjy8k002hqdb7ne7zth4w', 'استخراج إذن الإفراج النهائي', 6, 1, 0, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8k002wqdb7ea20f12p', 'cmvmtjy8k002hqdb7ne7zth4w', 'جاهز للاستلام / مكتمل', 7, 1, 1, 1792871758100);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003cqdb7j982r9nn', 'cmvmtjy8n0034qdb7yh7beu46', 'قيد التدقيق المستندي', 0, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003dqdb7bwdw1j1d', 'cmvmtjy8n0034qdb7yh7beu46', 'تصنيف البضاعة (HS Code)', 1, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003eqdb7b8ghjq2g', 'cmvmtjy8n0034qdb7yh7beu46', 'فتح البيان الجمركي', 2, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003fqdb7j6dpki0s', 'cmvmtjy8n0034qdb7yh7beu46', 'لجنة الكشف والمعاينة', 3, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003gqdb7mt5z5br9', 'cmvmtjy8n0034qdb7yh7beu46', 'مطابقة المواصفات والقيود الفنية', 4, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003hqdb7zm9edi1f', 'cmvmtjy8n0034qdb7yh7beu46', 'احتساب وسداد الرسوم والضرائب', 5, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003iqdb7tx45pi26', 'cmvmtjy8n0034qdb7yh7beu46', 'استخراج إذن الإفراج النهائي', 6, 1, 0, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8o003jqdb74nhva1k5', 'cmvmtjy8n0034qdb7yh7beu46', 'جاهز للاستلام / مكتمل', 7, 1, 1, 1792871758104);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8q003sqdb7f6kvpbzw', 'cmvmtjy8q003oqdb7hcqjo0ny', 'استلام الطلب', 0, 1, 0, 1792871758106);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8q003tqdb7rbq19h0r', 'cmvmtjy8q003oqdb7hcqjo0ny', 'مراجعة المستندات', 1, 1, 0, 1792871758106);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8q003uqdb77rrn210v', 'cmvmtjy8q003oqdb7hcqjo0ny', 'تقديم الفحص', 2, 1, 0, 1792871758106);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8q003vqdb7q3898wof', 'cmvmtjy8q003oqdb7hcqjo0ny', 'نتيجة الفحص', 3, 1, 0, 1792871758106);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8q003wqdb7n4878vk0', 'cmvmtjy8q003oqdb7hcqjo0ny', 'مكتمل', 4, 1, 1, 1792871758106);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8s0048qdb7c1hgdyny', 'cmvmtjy8s0040qdb7etx85pdq', 'استلام الطلب', 0, 1, 0, 1792871758108);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8s0049qdb79oad1u5s', 'cmvmtjy8s0040qdb7etx85pdq', 'التدقيق المستندي', 1, 1, 0, 1792871758108);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8s004aqdb7p1g379eq', 'cmvmtjy8s0040qdb7etx85pdq', 'إصدار بيان الترانزيت', 2, 1, 0, 1792871758108);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8s004bqdb7fb2b633e', 'cmvmtjy8s0040qdb7etx85pdq', 'تأمين العبور', 3, 1, 0, 1792871758108);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8s004cqdb7edh941qs', 'cmvmtjy8s0040qdb7etx85pdq', 'مكتمل', 4, 1, 1, 1792871758108);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8w004mqdb7qsa6mpqe', 'cmvmtjy8w004iqdb7k2jc2m58', 'استلام الطلب', 0, 1, 0, 1792871758112);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8w004nqdb70cvnphux', 'cmvmtjy8w004iqdb7k2jc2m58', 'مراجعة المستندات', 1, 1, 0, 1792871758112);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8w004oqdb7eyaztv3v', 'cmvmtjy8w004iqdb7k2jc2m58', 'تقديم الطلب لمصلحة الضرائب', 2, 1, 0, 1792871758112);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8w004pqdb72uh3h9yr', 'cmvmtjy8w004iqdb7k2jc2m58', 'سداد الرسوم', 3, 1, 0, 1792871758112);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8w004qqdb7srogut2k', 'cmvmtjy8w004iqdb7k2jc2m58', 'جاهز للاستلام', 4, 1, 1, 1792871758112);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8y004yqdb7ewvo7qqk', 'cmvmtjy8y004uqdb753ypustf', 'استلام الطلب', 0, 1, 0, 1792871758114);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8y004zqdb70iikwu65', 'cmvmtjy8y004uqdb753ypustf', 'تجهيز المستندات', 1, 1, 0, 1792871758114);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8y0050qdb7vhci0b4s', 'cmvmtjy8y004uqdb753ypustf', 'تقديم الطلب', 2, 1, 0, 1792871758114);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8y0051qdb76cvctyik', 'cmvmtjy8y004uqdb753ypustf', 'المتابعة', 3, 1, 0, 1792871758114);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvmtjy8y0052qdb7c0c1t9ug', 'cmvmtjy8y004uqdb753ypustf', 'جاهز للاستلام', 4, 1, 1, 1792871758114);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oihs0023rix3csa23b5l', 'cmvo9oihs0021rix31f9yw3vm', 'استلام الطلب', 0, 1, 0, 1792959311008);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oihs0024rix3u5pc7jb0', 'cmvo9oihs0021rix31f9yw3vm', 'تحديد أفضل رحلة', 1, 1, 0, 1792959311008);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oihs0025rix3lhavwa1w', 'cmvo9oihs0021rix31f9yw3vm', 'تأكيد الحجز', 2, 1, 0, 1792959311008);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oihs0026rix3rnxvbcby', 'cmvo9oihs0021rix31f9yw3vm', 'إصدار التذكرة', 3, 1, 0, 1792959311008);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oihs0027rix302qvpq4z', 'cmvo9oihs0021rix31f9yw3vm', 'التسليم', 4, 1, 1, 1792959311008);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9os2i002orix3nv2n1yhm', 'cmvo9os2h002jrix3t9321igt', 'الحجز والتسجيل', 0, 1, 0, 1792959323418);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9os2i002prix3kqxeof84', 'cmvo9os2h002jrix3t9321igt', 'استكمال المستندات', 1, 1, 0, 1792959323418);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9os2i002qrix3mhz6kkqn', 'cmvo9os2h002jrix3t9321igt', 'إصدار التأشيرة', 2, 1, 0, 1792959323418);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9os2i002rrix3w111z847', 'cmvo9os2h002jrix3t9321igt', 'تأكيد الطيران والإقامة', 3, 1, 0, 1792959323418);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9os2i002srix3013fkeah', 'cmvo9os2h002jrix3t9321igt', 'جاهز للسفر', 4, 1, 1, 1792959323418);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oyg50033rix3ltrtuq9j', 'cmvo9oyg50031rix3mnwcejc5', 'استلام الطلب', 0, 1, 0, 1792959331685);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oyg50034rix3fjxvczjl', 'cmvo9oyg50031rix3mnwcejc5', 'اختيار الفندق', 1, 1, 0, 1792959331685);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oyg50035rix3fnpkpm42', 'cmvo9oyg50031rix3mnwcejc5', 'تأكيد الحجز', 2, 1, 0, 1792959331685);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oyg50036rix3wel2nybq', 'cmvo9oyg50031rix3mnwcejc5', 'إصدار قسيمة الإقامة', 3, 1, 0, 1792959331685);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9oyg50037rix3wn2v2trs', 'cmvo9oyg50031rix3mnwcejc5', 'التسليم', 4, 1, 1, 1792959331685);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9pajo003prix3jnwjzg2e', 'cmvo9pajn003jrix32lkga7ai', 'استلام الطلب', 0, 1, 0, 1792959347364);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9pajo003qrix3y4kiwxkr', 'cmvo9pajn003jrix32lkga7ai', 'تجهيز ملف المتقدم', 1, 1, 0, 1792959347364);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9pajo003rrix3seypy29s', 'cmvo9pajn003jrix32lkga7ai', 'تقديم الطلب للسفارة', 2, 1, 0, 1792959347364);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9pajo003srix3it93m3zt', 'cmvo9pajn003jrix32lkga7ai', 'المتابعة مع السفارة', 3, 1, 0, 1792959347364);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvo9pajo003trix3cezlfbk9', 'cmvo9pajn003jrix32lkga7ai', 'استلام الجواز بالتأشيرة', 4, 1, 1, 1792959347364);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001rptuyi3669n8q', 'cmvqygf0m001jptuy9najc16n', 'قيد التدقيق المستندي', 0, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001sptuyuwkmnn2c', 'cmvqygf0m001jptuy9najc16n', 'تصنيف البضاعة (HS Code)', 1, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001tptuyi6h7qt6w', 'cmvqygf0m001jptuy9najc16n', 'فتح البيان الجمركي', 2, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001uptuy5z57ui00', 'cmvqygf0m001jptuy9najc16n', 'لجنة الكشف والمعاينة', 3, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001vptuypznwcek0', 'cmvqygf0m001jptuy9najc16n', 'مطابقة المواصفات والقيود الفنية', 4, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001wptuym431whcw', 'cmvqygf0m001jptuy9najc16n', 'احتساب وسداد الرسوم والضرائب', 5, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001xptuyu7dusc12', 'cmvqygf0m001jptuy9najc16n', 'استخراج إذن الإفراج النهائي', 6, 1, 0, 1793121856006);
INSERT INTO "ServiceStage" ("id", "serviceId", "name", "sortOrder", "isVisibleToClient", "notifyClient", "createdAt") VALUES ('cmvqygf0m001yptuyw0lvtgz5', 'cmvqygf0m001jptuy9najc16n', 'جاهز للاستلام / مكتمل', 7, 1, 1, 1793121856006);
INSERT INTO "Shipment" ("id", "requestId", "officeId", "billOfLadingNo", "containerNos", "containerType", "supplierName", "importerName", "originCountry", "arrivalPort", "carrier", "arrivalDate", "declarationNo", "goodsType", "weight", "packagesCount", "value", "currency", "releasePermitNo", "releasePermitAt", "releasePermitPath", "createdAt", "updatedAt") VALUES ('cmvmtjybs006gqdb7f1oanzlf', 'cmvmtjybo0068qdb70gzu388m', 'cmvmtjy0d001eqdb7sgxbh70e', 'MSCU-2026-118342', 'MSCU1234567', '20FT', 'Golden Rice Trading Co.', 'شركة النور للتجارة والاستيراد', 'الهند', 'ميناء عدن', 'MSC', 1792266958210, 'ADN-2026-45231', 'مواد غذائية', 18500, 850, 42000, 'USD', NULL, NULL, NULL, 1792871758216, 1792871758216);
INSERT INTO "ShipmentItem" ("id", "shipmentId", "description", "hsCodeId", "hsCodeText", "originCountry", "quantity", "unit", "weight", "value", "currency", "dutyRate", "createdAt") VALUES ('cmvmtjybs006iqdb7dvf1rbsv', 'cmvmtjybs006gqdb7f1oanzlf', 'أرز بسمتي هندي فاخر', 'cmvmtjxz80006qdb7o2wei1kv', '100630', 'الهند', 600, 'شوال', 12000, 24000, 'USD', 5, 1792871758216);
INSERT INTO "ShipmentItem" ("id", "shipmentId", "description", "hsCodeId", "hsCodeText", "originCountry", "quantity", "unit", "weight", "value", "currency", "dutyRate", "createdAt") VALUES ('cmvmtjybs006jqdb78cv3qhc6', 'cmvmtjybs006gqdb7f1oanzlf', 'سكر أبيض مكرر', 'cmvmtjxz90008qdb7ghvl8fb1', '170199', 'البرازيل', 250, 'شوال', 5000, 13000, 'USD', 20, 1792871758216);
INSERT INTO "Task" ("id", "officeId", "requestId", "title", "note", "dueAt", "assigneeId", "isDone", "doneAt", "createdByName", "createdAt") VALUES ('cmvqyeoxz001hptuyd5zdwgpi', 'cmvmtjy0d001eqdb7sgxbh70e', NULL, 'توقيع المستندات لدي بنك اليمن والكويت', NULL, 1793370120000, NULL, 0, NULL, 'أحمد عبدالله', 1793121775559);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjxyz0000qdb737e0me50', NULL, 'hussin99q@gmail.com', NULL, 'مدير منصة مراسي', '$2b$10$I1oPM5rQeLBqcGajVxHuVudS6xp3MKZOx0jenue5wHvGr8xRUS94.', 'SUPER_ADMIN', NULL, 1, NULL, '2026-10-27T20:12:11.831+00:00', 1792871757755, 1793215271723);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjy2e001kqdb77c81dk3h', 'cmvmtjy0d001eqdb7sgxbh70e', 'admin@redsea-clearance.ye', '+967 77 123 4567', 'أحمد عبدالله', '$2b$10$2DU09idq9arWMosFGpFOHOiSAPmqxLte3AGWLv/NoeLYpoHLvqld6', 'OFFICE_ADMIN', NULL, 1, NULL, 1793218707852, 1792871757879, 1793218707853);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjy4e001mqdb7wckj46o8', 'cmvmtjy0d001eqdb7sgxbh70e', 'sara@redsea-clearance.ye', '+967 71 234 5678', 'سارة حسن', '$2b$10$1EVDJVQqZTTF6UNyQmv9.OgTs.6Btuw1tF6WLYQRFmvzVy5TMc3cy', 'STAFF', NULL, 1, NULL, 1793218630671, 1792871757950, 1793218760308);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjy6e001oqdb7xeiqpxqf', 'cmvmtjy0d001eqdb7sgxbh70e', 'broker@redsea-clearance.ye', '+967 73 345 6789', 'علي المخلص', '$2b$10$SQCjLve/I05k7o4H/W8NOOuLGEfinW9OX1NULTu2zDOLYFYL3vLjW', 'BROKER', NULL, 1, NULL, 1792953063485, 1792871758022, 1792953063487);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmtjy8e001qqdb7fhtfhegf', 'cmvmtjy0d001eqdb7sgxbh70e', 'accountant@redsea-clearance.ye', '+967 77 456 7890', 'فاطمة المحاسب', '$2b$10$WqYpAtGwkG1KcMcVHQ65qu..8WmRNFxj43BdkxWCTIkkWLjMpNaDO', 'ACCOUNTANT', NULL, 1, NULL, 1792952821147, 1792871758095, 1792952821148);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvmw27wt002jqdpgwrb0rdyo', 'cmvmw07pb0017qdpg10ffanv7', 'manager@adentrade.ye', NULL, 'محمد الشميري', '$2b$10$rpX45cni5JOet1dRpqEM0ezok1/y8klXrTawWuIaZNtP9scrAUUba', 'OFFICE_ADMIN', NULL, 1, NULL, NULL, 1792875969677, 1792875969677);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvo91qkb000prix3zxs93z2a', 'cmvo8wh6w000frix3hjatqzed', 'supportaldalal@gmail.com', NULL, 'بن خليل', '$2b$10$z7WCeWaO2M4KohX9LM00q.DhGoPhMMFIpb8zSFbJeA.a1D00SbjyO', 'OFFICE_ADMIN', NULL, 1, NULL, 1793215038582, 1792958248379, 1793215038583);
INSERT INTO "User" ("id", "officeId", "email", "phone", "name", "passwordHash", "role", "permissions", "isActive", "invitedBy", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmvqz086x002eptuyfxyra3al', 'cmvo8wh6w000frix3hjatqzed', 'huss@gmail.com', NULL, 'علي احمد', '$2b$10$CKMLbDMwxO7BocTVhLj9UOcC/8dIe.e/ERNT7FXeTfMpRlEDXdPVa', 'BROKER', NULL, 1, 'بن خليل', NULL, 1793122780281, 1793122780281);

COMMIT;
