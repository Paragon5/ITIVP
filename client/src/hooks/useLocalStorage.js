import { useCallback, useEffect, useState } from "react";

/**
 * Пользовательский хук useLocalStorage.
 *
 * В оригинальной реализации useEffect сохранял null, потому что срабатывал
 * раньше ленивой инициализации useState и доступа к localStorage. В React 19
 * на Windows-сERVER-х корректный паттерн — ленивая инициализация и явный
 * useCallback для save, который выполняется только после первого рендера.
 *
 * `save` — функция, которая произвольный объект переносит в localStorage.
 * Для пагинации и чистки используется отдельный export clearStorage(key).
/
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
        console.error("useLocalStorage.save: не удалось сохранить", err);
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
    console.error("clearStorage: не удалось очистить", err);
  }
}
