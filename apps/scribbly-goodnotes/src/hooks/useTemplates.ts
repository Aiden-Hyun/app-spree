import { useState, useEffect, useCallback } from "react";
import { TemplateService } from "../services/templateService";
import { Template } from "../types";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TemplateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Error loading templates:", err);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = useCallback(
    async (
      title: string,
      description: string,
      category: string,
      content: string,
      icon?: string
    ) => {
      try {
        const newTemplate = await TemplateService.createTemplate(
          title,
          description,
          category,
          content,
          icon
        );
        await loadTemplates(); // Reload to get updated list
        return newTemplate;
      } catch (err) {
        console.error("Error creating template:", err);
        throw err;
      }
    },
    [loadTemplates]
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<Template>) => {
      try {
        const updatedTemplate = await TemplateService.updateTemplate(
          id,
          updates
        );
        await loadTemplates(); // Reload to get updated list
        return updatedTemplate;
      } catch (err) {
        console.error("Error updating template:", err);
        throw err;
      }
    },
    [loadTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      try {
        await TemplateService.deleteTemplate(id);
        await loadTemplates(); // Reload to get updated list
      } catch (err) {
        console.error("Error deleting template:", err);
        throw err;
      }
    },
    [loadTemplates]
  );

  const applyTemplate = useCallback((template: Template): string => {
    const variables = TemplateService.getDefaultVariables();
    return TemplateService.applyTemplate(template.content || "", variables);
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    refresh: loadTemplates,
  };
}

export function useTemplate(id: string) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await TemplateService.getTemplate(id);
        setTemplate(data);
      } catch (err) {
        console.error("Error loading template:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load template"
        );
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id]);

  const applyTemplate = useCallback((): string => {
    if (!template) return "";
    const variables = TemplateService.getDefaultVariables();
    return TemplateService.applyTemplate(template.content || "", variables);
  }, [template]);

  return {
    template,
    loading,
    error,
    applyTemplate,
  };
}


