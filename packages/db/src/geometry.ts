import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS `geometry(Geometry, 4326)` column.
 *
 * Stored as WKT/WKB by PostGIS; we model it as a string at the ORM layer
 * and rely on PostGIS functions (ST_DWithin, ST_GeomFromText, etc.) for
 * spatial operations executed via raw SQL fragments in repositories.
 *
 * SRID 4326 = WGS-84 (longitude/latitude) — the same CRS used by postcodes.io
 * and GeoJSON. All service_area columns use this type.
 */
export const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Geometry, 4326)";
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});
