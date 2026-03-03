import firebase from "firebase/compat/app"

const ADMIN_EMAILS = ["yk8292238@gmail.com"]

export function isAdmin(user: firebase.User | null): boolean {
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}

export function requireAdmin(user: firebase.User | null): void {
  if (!isAdmin(user)) {
    throw new Error("Admin access required")
  }
}

export async function checkAdminAccess(user: firebase.User | null): Promise<boolean> {
  return isAdmin(user)
}