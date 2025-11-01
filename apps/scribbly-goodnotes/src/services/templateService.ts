import { supabase } from "../supabase";
import { Template } from "../types";

export class TemplateService {
  /**
   * Get all available templates (system, public, and user's own)
   */
  static async getTemplates(): Promise<Template[]> {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("category")
      .order("title");

    if (error) throw error;
    return data || [];
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("category", category)
      .order("title");

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single template by ID
   */
  static async getTemplate(id: string): Promise<Template> {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Template not found");

    return data;
  }

  /**
   * Create a custom template
   */
  static async createTemplate(
    title: string,
    description: string,
    category: string,
    content: string,
    icon: string = "document"
  ): Promise<Template> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.user.id,
        title,
        description,
        category,
        content,
        icon,
        is_public: false,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    id: string,
    updates: Partial<Template>
  ): Promise<Template> {
    const { data, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from("templates").delete().eq("id", id);

    if (error) throw error;
  }

  /**
   * Increment usage count for a template
   */
  static async incrementUsageCount(id: string): Promise<void> {
    const { data: template } = await supabase
      .from("templates")
      .select("usage_count")
      .eq("id", id)
      .single();

    if (template) {
      await supabase
        .from("templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", id);
    }
  }

  /**
   * Apply template content with variable substitution
   */
  static applyTemplate(
    content: string,
    variables: Record<string, string>
  ): string {
    let result = content;

    // Replace template variables like {{date}}, {{week_start}}, etc.
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Get default template variables
   */
  static getDefaultVariables(): Record<string, string> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      day: now.toLocaleDateString("en-US", { weekday: "long" }),
      month: now.toLocaleDateString("en-US", { month: "long" }),
      year: now.getFullYear().toString(),
      week_start: weekStart.toLocaleDateString(),
      week_number: this.getWeekNumber(now).toString(),
    };
  }

  /**
   * Get week number of the year
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
