/**
 * Almacén clave-valor mínimo sobre IndexedDB, para guardar cosas que no caben en localStorage
 * (fotos como Blob). Si IndexedDB no existe o falla (modo privado, cuota), todo responde en
 * silencio sin romper nada: lo que se guarda aquí es una comodidad, nunca un requisito.
 */

const BD = "domna-local";
const ALMACEN = "kv";

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(BD, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(ALMACEN);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function operar<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await abrir();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(ALMACEN, modo);
      const req = fn(tx.objectStore(ALMACEN));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
      tx.oncomplete = () => db.close();
      tx.onabort = () => {
        db.close();
        resolve(undefined);
      };
    } catch {
      db.close();
      resolve(undefined);
    }
  });
}

export async function idbLeer<T>(clave: string): Promise<T | undefined> {
  return (await operar("readonly", (s) => s.get(clave))) as T | undefined;
}

export async function idbGuardar(clave: string, valor: unknown): Promise<boolean> {
  const ok = await operar("readwrite", (s) => s.put(valor, clave));
  return ok !== undefined;
}

export async function idbBorrar(clave: string): Promise<void> {
  await operar("readwrite", (s) => s.delete(clave));
}

/** Borra todas las claves que empiezan con `prefijo`, recorriéndolas con un cursor. */
export async function idbBorrarPrefijo(prefijo: string): Promise<void> {
  const db = await abrir();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(ALMACEN, "readwrite");
      const store = tx.objectStore(ALMACEN);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        if (typeof cursor.key === "string" && cursor.key.startsWith(prefijo)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => resolve();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
