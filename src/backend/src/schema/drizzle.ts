// Drizzle ORM schema for Property Management Software
import { pgTable, serial, text, varchar, integer, decimal, boolean, timestamp, json, pgEnum, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']);
export const propertyTypeEnum = pgEnum('property_type', ['APARTMENT', 'VILLA', 'HOUSE', 'PLOT', 'COMMERCIAL', 'OFFICE', 'SHOP', 'WAREHOUSE']);
export const propertyStatusEnum = pgEnum('property_status', ['AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE', 'DRAFT']);
export const inventoryStatusEnum = pgEnum('inventory_status', ['AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE', 'DRAFT']);
export const leadSourceEnum = pgEnum('lead_source', ['WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER']);
export const leadStatusEnum = pgEnum('lead_status', ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED', 'LOST']);
export const leadStageEnum = pgEnum('lead_stage', ['ENQUIRY_RECEIVED', 'SITE_VISIT', 'PROPOSAL_SENT', 'NEGOTIATION', 'BOOKING', 'SOLD', 'LOST']);
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);
export const bookingStageEnum = pgEnum('booking_stage', ['SOLD', 'TENTATIVELY_BOOKED', 'CONFIRMED', 'CANCELLED']);
export const projectStatusEnum = pgEnum('project_status', ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']);
export const paymentMethodEnum = pgEnum('payment_method', ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']);
export const notificationTypeEnum = pgEnum('notification_type', ['BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'LEAD_ASSIGNED', 'LEAD_UPDATED', 'PROPERTY_ADDED', 'PROPERTY_UPDATED', 'CUSTOMER_ADDED', 'SYSTEM_ALERT']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('AGENT'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  avatar: text('avatar'),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  backupCodes: json('backup_codes').$type<string[]>().default([]),
  lastLoginAt: timestamp('last_login_at'),
  lastPasswordChange: timestamp('last_password_change'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires'),
  loginAttempts: integer('login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  preferences: json('preferences'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  region: varchar('region', { length: 20 }).notNull().default('INDIA'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  isActiveIdx: index('users_is_active_idx').on(table.isActive),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt)
}));

// Properties table
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: propertyTypeEnum('type').notNull(),
  status: propertyStatusEnum('status').notNull().default('AVAILABLE'),
  location: varchar('location', { length: 255 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull().default('India'),
  pincode: varchar('pincode', { length: 10 }),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  area: decimal('area', { precision: 10, scale: 2 }).notNull(),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  floors: integer('floors'),
  facing: varchar('facing', { length: 50 }),
  vastu: varchar('vastu', { length: 50 }),
  amenities: json('amenities').$type<string[]>().default([]),
  features: json('features').$type<string[]>().default([]),
  description: text('description'),
  images: json('images').$type<string[]>().default([]),
  videos: json('videos').$type<string[]>().default([]),
  documents: json('documents').$type<string[]>().default([]),
  floorPlan: text('floor_plan'),
  layout3D: text('layout_3d'),
  gmapIframe: text('gmap_iframe'),
  coordinates: json('coordinates'),
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  views: integer('views').notNull().default(0),
  inquiries: integer('inquiries').notNull().default(0),
  bookings: integer('bookings').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id)
}, (table) => ({
  typeIdx: index('properties_type_idx').on(table.type),
  statusIdx: index('properties_status_idx').on(table.status),
  cityIdx: index('properties_city_idx').on(table.city),
  priceIdx: index('properties_price_idx').on(table.price),
  createdAtIdx: index('properties_created_at_idx').on(table.createdAt),
  isActiveIdx: index('properties_is_active_idx').on(table.isActive)
}));

// Inventory items table
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  unitNumber: varchar('unit_number', { length: 50 }).notNull(),
  floor: integer('floor').notNull(),
  block: varchar('block', { length: 50 }),
  status: inventoryStatusEnum('status').notNull().default('AVAILABLE'),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  area: decimal('area', { precision: 10, scale: 2 }).notNull(),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  facing: varchar('facing', { length: 50 }),
  vastu: varchar('vastu', { length: 50 }),
  amenities: json('amenities').$type<string[]>().default([]),
  images: json('images').$type<string[]>().default([]),
  floorPlan: text('floor_plan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  propertyIdIdx: index('inventory_items_property_id_idx').on(table.propertyId),
  statusIdx: index('inventory_items_status_idx').on(table.status),
  unitNumberIdx: index('inventory_items_unit_number_idx').on(table.unitNumber),
  uniquePropertyUnit: index('inventory_items_property_unit_unique').on(table.propertyId, table.unitNumber)
}));

// Customers table
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  dateOfBirth: timestamp('date_of_birth'),
  occupation: varchar('occupation', { length: 100 }),
  income: decimal('income', { precision: 15, scale: 2 }),
  preferences: json('preferences'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id)
}, (table) => ({
  emailIdx: index('customers_email_idx').on(table.email),
  phoneIdx: index('customers_phone_idx').on(table.phone),
  isActiveIdx: index('customers_is_active_idx').on(table.isActive)
}));

// Leads table with BlinderSøe stages
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  source: leadSourceEnum('source').notNull(),
  status: leadStatusEnum('status').notNull().default('NEW'),
  stage: leadStageEnum('stage').notNull().default('ENQUIRY_RECEIVED'),
  score: integer('score').notNull().default(0),
  interest: text('interest'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  notes: text('notes'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  stageDateStart: timestamp('stage_date_start'),
  attachments: json('attachments').$type<string[]>().default([]),
  history: json('history').$type<any[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id)
}, (table) => ({
  emailIdx: index('leads_email_idx').on(table.email),
  phoneIdx: index('leads_phone_idx').on(table.phone),
  statusIdx: index('leads_status_idx').on(table.status),
  stageIdx: index('leads_stage_idx').on(table.stage),
  sourceIdx: index('leads_source_idx').on(table.source),
  assignedToIdx: index('leads_assigned_to_idx').on(table.assignedTo),
  stageDateStartIdx: index('leads_stage_date_start_idx').on(table.stageDateStart)
}));

// Bookings table with BlinderSøe stages
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  inventoryId: uuid('inventory_id').references(() => inventoryItems.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  agentId: uuid('agent_id').notNull().references(() => users.id),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  stage: bookingStageEnum('stage').notNull().default('TENTATIVELY_BOOKED'),
  bookingDate: timestamp('booking_date').notNull(),
  moveInDate: timestamp('move_in_date'),
  moveOutDate: timestamp('move_out_date'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  advanceAmount: decimal('advance_amount', { precision: 15, scale: 2 }),
  paymentMethod: paymentMethodEnum('payment_method'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  tokenDates: json('token_dates').$type<string[]>().default([]),
  notes: text('notes'),
  pricingBreakdown: json('pricing_breakdown'),
  documents: json('documents').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id)
}, (table) => ({
  propertyIdIdx: index('bookings_property_id_idx').on(table.propertyId),
  customerIdIdx: index('bookings_customer_id_idx').on(table.customerId),
  agentIdIdx: index('bookings_agent_id_idx').on(table.agentId),
  statusIdx: index('bookings_status_idx').on(table.status),
  stageIdx: index('bookings_stage_idx').on(table.stage),
  bookingDateIdx: index('bookings_booking_date_idx').on(table.bookingDate)
}));

// Projects table (for BlinderSøe integration)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('UPCOMING'),
  location: varchar('location', { length: 255 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull().default('India'),
  pincode: varchar('pincode', { length: 10 }),
  totalUnits: integer('total_units').notNull().default(0),
  availableUnits: integer('available_units').notNull().default(0),
  soldUnits: integer('sold_units').notNull().default(0),
  priceRange: json('price_range'),
  amenities: json('amenities').$type<string[]>().default([]),
  features: json('features').$type<string[]>().default([]),
  images: json('images').$type<string[]>().default([]),
  videos: json('videos').$type<string[]>().default([]),
  documents: json('documents').$type<string[]>().default([]),
  floorPlan: text('floor_plan'),
  layout3D: text('layout_3d'),
  gmapIframe: text('gmap_iframe'),
  coordinates: json('coordinates'),
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  views: integer('views').notNull().default(0),
  inquiries: integer('inquiries').notNull().default(0),
  bookings: integer('bookings').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id)
}, (table) => ({
  statusIdx: index('projects_status_idx').on(table.status),
  cityIdx: index('projects_city_idx').on(table.city),
  isActiveIdx: index('projects_is_active_idx').on(table.isActive),
  createdAtIdx: index('projects_created_at_idx').on(table.createdAt)
}));

// Company table for multi-region support
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  region: varchar('region', { length: 20 }).notNull().default('INDIA'),
  currency: varchar('currency', { length: 10 }).notNull().default('INR'),
  gst: varchar('gst', { length: 50 }),
  vat: varchar('vat', { length: 50 }),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).notNull().default('0.05'),
  taxName: varchar('tax_name', { length: 50 }).notNull().default('GST'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  logo: text('logo'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  regionIdx: index('companies_region_idx').on(table.region),
  isActiveIdx: index('companies_is_active_idx').on(table.isActive)
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  bookings: many(bookings),
  leads: many(leads),
  customers: many(customers),
  createdProperties: many(properties, { relationName: 'createdBy' }),
  updatedProperties: many(properties, { relationName: 'updatedBy' }),
  createdCustomers: many(customers, { relationName: 'createdBy' }),
  updatedCustomers: many(customers, { relationName: 'updatedBy' }),
  createdLeads: many(leads, { relationName: 'createdBy' }),
  updatedLeads: many(leads, { relationName: 'updatedBy' }),
  createdBookings: many(bookings, { relationName: 'createdBy' }),
  updatedBookings: many(bookings, { relationName: 'updatedBy' }),
  createdProjects: many(projects, { relationName: 'createdBy' }),
  updatedProjects: many(projects, { relationName: 'updatedBy' })
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  createdBy: one(users, { fields: [properties.createdById], references: [users.id] }),
  updatedBy: one(users, { fields: [properties.updatedById], references: [users.id] }),
  inventoryItems: many(inventoryItems),
  bookings: many(bookings)
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  property: one(properties, { fields: [inventoryItems.propertyId], references: [properties.id] }),
  bookings: many(bookings)
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  createdBy: one(users, { fields: [customers.createdById], references: [users.id] }),
  updatedBy: one(users, { fields: [customers.updatedById], references: [users.id] }),
  bookings: many(bookings),
  leads: many(leads)
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  customer: one(customers, { fields: [leads.customerId], references: [customers.id] }),
  createdBy: one(users, { fields: [leads.createdById], references: [users.id] }),
  updatedBy: one(users, { fields: [leads.updatedById], references: [users.id] }),
  assignedTo: one(users, { fields: [leads.assignedTo], references: [users.id] })
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  property: one(properties, { fields: [bookings.propertyId], references: [properties.id] }),
  inventory: one(inventoryItems, { fields: [bookings.inventoryId], references: [inventoryItems.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  agent: one(users, { fields: [bookings.agentId], references: [users.id] }),
  createdBy: one(users, { fields: [bookings.createdById], references: [users.id] }),
  updatedBy: one(users, { fields: [bookings.updatedById], references: [users.id] })
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, { fields: [projects.createdById], references: [users.id] }),
  updatedBy: one(users, { fields: [projects.updatedById], references: [users.id] })
}));
