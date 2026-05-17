// Neon (Postgres) schema — authoritative production database
export * from './neon/index.js'
export type {
  GlucoseReadingRow as TursoGlucoseReadingRow,
  NewGlucoseReadingRow as NewTursoGlucoseReadingRow,
} from './turso/glucose.js'
// Turso (SQLite) schema — local CGM cache for offline/edge reads
// Renamed here because `glucoseReadings` conflicts with the Neon table of the same name.
// Import directly from './turso/glucose.js' when you need the SQLite table.
export { glucoseReadings as tursoGlucoseReadings } from './turso/glucose.js'
