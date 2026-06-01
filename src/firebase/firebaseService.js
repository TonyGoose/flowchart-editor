// src/firebase/firebaseService.js
import { db, auth } from './config';
import {
  collection, doc, setDoc, getDocs, addDoc,
  deleteDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp, writeBatch
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// ========== АВТОРИЗАЦИЯ ==========

export const loginTeacher = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutTeacher = async () => {
  await signOut(auth);
};

// ========== ВАРИАНТЫ ==========

// Публикация одного варианта с меткой времени
export const publishVariantToCloud = async (variant) => {
  const ref = doc(db, 'variants', String(variant.id));
  await setDoc(ref, { ...variant, updatedAt: serverTimestamp() });
};

// Массовая публикация всех вариантов (batch)
export const publishAllVariantsToCloud = async (variants) => {
  const values = Object.values(variants);
  // Firestore batch limit = 500; делим на чанки
  for (let i = 0; i < values.length; i += 400) {
    const batch = writeBatch(db);
    values.slice(i, i + 400).forEach(v => {
      const ref = doc(db, 'variants', String(v.id));
      batch.set(ref, { ...v, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
};

// Синхронизация — только варианты изменённые после lastSyncTime (ISO-строка или null)
export const syncNewVariants = async (lastSyncTime) => {
  let q;
  if (lastSyncTime) {
    const since = Timestamp.fromDate(new Date(lastSyncTime));
    q = query(collection(db, 'variants'), where('updatedAt', '>', since));
  } else {
    q = collection(db, 'variants');
  }
  const snapshot = await getDocs(q);
  const updates = {};
  snapshot.forEach(d => {
    const data = d.data();
    // Конвертируем Firestore Timestamp → строка для localStorage
    const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || null;
    updates[d.id] = { ...data, id: parseInt(d.id), updatedAt };
  });
  return updates; // { variantId: variantData }
};

export const deleteVariantFromCloud = async (variantId) => {
  await deleteDoc(doc(db, 'variants', String(variantId)));
};

// ========== РЕЗУЛЬТАТЫ ==========

// Сохранение результата студента (serverTimestamp для правильной сортировки)
export const saveResultToCloud = async (result) => {
  await addDoc(collection(db, 'results'), {
    ...result,
    timestamp: serverTimestamp(),
  });
};

// Подписка в реальном времени — возвращает функцию отписки
export const subscribeToResults = (callback) => {
  const q = query(collection(db, 'results'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const results = [];
      snapshot.forEach(d => {
        const data = d.data();
        results.push({
          id: d.id,
          ...data,
          // Нормализуем Timestamp → ISO-строка
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        });
      });
      callback(results);
    },
    (error) => {
      console.error('Ошибка подписки на результаты:', error);
    }
  );
};

// Очистка всех результатов из Firebase (batch delete)
export const clearResultsFromCloud = async () => {
  const snapshot = await getDocs(collection(db, 'results'));
  if (snapshot.empty) return;
  for (let i = 0; i < snapshot.docs.length; i += 400) {
    const batch = writeBatch(db);
    snapshot.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
};
