import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const save = useCallback(
    (nextValue, cb) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        if (cb) cb();
      } catch (err) {
        console.error("useLocalStorage.save: ", err);
        if (cb) cb(err);
      }
    },
    [key]
  );

  useEffect(() => {
    save(value);
  }, [value, save]);

  return [value, setValue, save];
}

export function isEmptyPage(arr) {
  return !Array.isArray(arr) || arr.length === 0;
}

export function clearStorage(key) {
  try {
  } catch (err) {
    console.error("clearStorage: ", err);
  }
}
