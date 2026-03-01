import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

interface CourseItem {
  key: string;
  name: string;
  description: string;
}

export const searchCourses = async (
  query: string,
  limit: number = 10,
): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, "courses"));
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return [];

    const matched = snapshot.docs
      .map((doc) => {
        const data = doc.data() as Partial<CourseItem>;

        const name = (data.name ?? "").toLowerCase();
        const description = (data.description ?? "").toLowerCase();

        let score = 0;
        if (name.includes(searchTerm)) score += 2;
        if (description.includes(searchTerm)) score += 1;

        const id = (data.key ?? doc.id) as string;
        return { id, score };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return matched.map((c) => c.id);
  } catch (error) {
    console.error("Error searching courses:", error);
    return [];
  }
};
