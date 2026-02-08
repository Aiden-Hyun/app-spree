import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { ReportCategory } from "@/types";

const contentReportsCollection = collection(db, "content_reports");

export async function reportContent(
  userId: string,
  contentId: string,
  contentType: string,
  category: ReportCategory,
  description?: string
): Promise<boolean> {
  try {
    await addDoc(contentReportsCollection, {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      category,
      description: description || null,
      reported_at: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error reporting content:", error);
    return false;
  }
}
