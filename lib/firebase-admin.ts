import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import { uploadToBackblaze } from "./backblaze"
import type { Product, Order } from "./types"

// Product Management
export const createProduct = async (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">,
  adminUserId: string,
) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  try {
    const productRef = doc(db, "products", productId)
    await updateDoc(productRef, {
      ...productData,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    await deleteDoc(doc(db, "products", productId))
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Real-time product listener for instant updates
export const subscribeToProducts = (
  callback: (products: Product[]) => void,
  adminView = false,
  pageSize = 50,
): Unsubscribe => {
  try {
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize))

    if (!adminView) {
      q = query(
        collection(db, "products"),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize),
      )
    }

    return onSnapshot(
      q,
      (querySnapshot) => {
        const products = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]

        callback(products)
      },
      (error) => {
        console.error("Error in products subscription:", error)
        callback([]) // Return empty array on error
      },
    )
  } catch (error) {
    console.error("Error setting up products subscription:", error)
    return () => {} // Return empty unsubscribe function
  }
}

export const getProducts = async (pageSize = 10, lastDoc?: QueryDocumentSnapshot<DocumentData>, adminView = false) => {
  try {
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize))

    if (!adminView) {
      q = query(
        collection(db, "products"),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize),
      )
    }

    if (lastDoc) {
      if (adminView) {
        q = query(collection(db, "products"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
      } else {
        q = query(
          collection(db, "products"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize),
        )
      }
    }

    const querySnapshot = await getDocs(q)
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    return {
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting products:", error)
    throw error
  }
}

// Function for individual product pages
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", productId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const product = { id: docSnap.id, ...docSnap.data() } as Product
      return product
    }
    return null
  } catch (error) {
    console.error("Error getting product by ID:", error)
    throw error
  }
}

export const getProduct = async (productId: string, adminView = false): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", productId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const product = { id: docSnap.id, ...docSnap.data() } as Product

      if (!adminView && !product.isActive) {
        return null
      }

      return product
    }
    return null
  } catch (error) {
    console.error("Error getting product:", error)
    throw error
  }
}

export const getActiveProducts = async (pageSize = 10, lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
  try {
    let q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    )

    if (lastDoc) {
      q = query(
        collection(db, "products"),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      )
    }

    const querySnapshot = await getDocs(q)
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    return {
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting active products:", error)
    throw error
  }
}

export const getActiveProductsByCategory = async (
  category: string,
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
) => {
  try {
    let q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    )

    if (lastDoc) {
      q = query(
        collection(db, "products"),
        where("isActive", "==", true),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      )
    }

    const querySnapshot = await getDocs(q)
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    return {
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting active products by category:", error)
    throw error
  }
}

// Order Management
export const getOrders = async (pageSize = 10, lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
  try {
    let q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(pageSize))

    if (lastDoc) {
      q = query(collection(db, "orders"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
    }

    const querySnapshot = await getDocs(q)
    const orders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[]

    return {
      orders,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
  try {
    const orderRef = doc(db, "orders", orderId)
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// File Upload
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  try {
    // Use Backblaze for file storage if available, fallback to Firebase Storage
    if (process.env.NEXT_PUBLIC_USE_BACKBLAZE === "true") {
      return await uploadToBackblaze(file, path, onProgress)
    }

    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export const uploadMultipleFiles = async (
  files: File[],
  basePath: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => {
      const path = `${basePath}/${Date.now()}_${index}_${file.name}`
      return uploadFile(file, path, (progress) => {
        onProgress?.(index, progress)
      })
    })

    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error("Error uploading multiple files:", error)
    throw error
  }
}

export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}
