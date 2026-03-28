const REGION = "northamerica-northeast1";

const DIFFICULTY_VALUES = ["beginner", "intermediate", "advanced"];
const THEME_VALUES = [
  "focus",
  "stress",
  "anxiety",
  "sleep",
  "body-scan",
  "relationships",
  "self-esteem",
  "gratitude",
  "loving-kindness",
];
const TECHNIQUE_VALUES = [
  "breathing",
  "body-scan",
  "visualization",
  "loving-kindness",
  "mindfulness",
  "grounding",
  "progressive-relaxation",
];
const BEDTIME_CATEGORY_VALUES = [
  "nature",
  "fantasy",
  "travel",
  "fiction",
  "thriller",
  "fairytale",
];

const CONTENT_MANAGER_EDITABLE_FIELDS = {
  guided_meditations: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    duration_minutes: { type: "integer", required: true, min: 1 },
    thumbnailUrl: { type: "string" },
    themes: { type: "string_array_enum", values: THEME_VALUES },
    techniques: { type: "string_array_enum", values: TECHNIQUE_VALUES },
    difficulty_level: { type: "enum", required: true, values: DIFFICULTY_VALUES },
    instructor: { type: "string" },
  },
  sleep_meditations: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    duration_minutes: { type: "integer", required: true, min: 1 },
    thumbnailUrl: { type: "string" },
    instructor: { type: "string", required: true },
    icon: { type: "string", required: true },
    color: { type: "string", required: true },
  },
  bedtime_stories: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    duration_minutes: { type: "integer", required: true, min: 1 },
    thumbnail_url: { type: "string" },
    narrator: { type: "string", required: true },
    category: { type: "enum", required: true, values: BEDTIME_CATEGORY_VALUES },
  },
  emergency_meditations: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    duration_minutes: { type: "integer", required: true, min: 1 },
    thumbnailUrl: { type: "string" },
    narrator: { type: "string" },
    icon: { type: "string", required: true },
    color: { type: "string", required: true },
  },
  courses: {
    title: { type: "string", required: true },
    subtitle: { type: "string" },
    description: { type: "string", required: true },
    thumbnailUrl: { type: "string" },
    instructor: { type: "string", required: true },
    icon: { type: "string" },
    color: { type: "string", required: true },
  },
  course_sessions: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    duration_minutes: { type: "integer", required: true, min: 1 },
  },
};

function getHttpsError(functionsLib, code, message) {
  return new functionsLib.https.HttpsError(code, message);
}

function normalizeString(value, required = false) {
  if (value === null || value === undefined) {
    return required ? "" : null;
  }
  const text = String(value).trim();
  if (!text) {
    return required ? "" : null;
  }
  return text;
}

function normalizeInteger(value, definition) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < (definition.min || 1)) {
    return { ok: false };
  }
  return { ok: true, value: parsed };
}

function normalizeEnum(value, definition) {
  const normalized = normalizeString(value, definition.required);
  if ((normalized === null || normalized === "") && !definition.required) {
    return { ok: true, value: null };
  }
  if (!definition.values.includes(normalized)) {
    return { ok: false };
  }
  return { ok: true, value: normalized };
}

function normalizeStringArrayEnum(value, definition) {
  if (value === null || value === undefined) {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(value)) {
    return { ok: false };
  }
  const allowed = new Set(definition.values);
  const raw = value.map((item) => String(item));
  if (raw.some((item) => !allowed.has(item))) {
    return { ok: false };
  }
  const normalized = definition.values.filter((item) => raw.includes(item));
  return { ok: true, value: normalized };
}

function normalizePatchValue(definition, value) {
  switch (definition.type) {
    case "integer":
      return normalizeInteger(value, definition);
    case "enum":
      return normalizeEnum(value, definition);
    case "string_array_enum":
      return normalizeStringArrayEnum(value, definition);
    case "string": {
      const normalized = normalizeString(value, definition.required);
      if (definition.required && normalized === "") {
        return { ok: false };
      }
      return { ok: true, value: normalized };
    }
    default:
      return { ok: false };
  }
}

function valuesEqual(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return left === right;
}

function serializeAuditValue(value) {
  if (value === undefined) return null;
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (value === null) return null;
  if (typeof value === "number") return value;
  const normalized = normalizeString(value, false);
  return normalized === null ? null : normalized;
}

function sanitizePatch(functionsLib, collection, patch) {
  const definitionMap = CONTENT_MANAGER_EDITABLE_FIELDS[collection];
  if (!definitionMap) {
    throw getHttpsError(functionsLib, "invalid-argument", "Unknown content collection.");
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw getHttpsError(functionsLib, "invalid-argument", "Patch must be an object.");
  }

  const sanitized = {};
  for (const [fieldName, rawValue] of Object.entries(patch)) {
    const definition = definitionMap[fieldName];
    if (!definition) {
      throw getHttpsError(functionsLib, "invalid-argument", `Field "${fieldName}" is not editable.`);
    }

    const normalized = normalizePatchValue(definition, rawValue);
    if (!normalized.ok) {
      throw getHttpsError(
        functionsLib,
        "invalid-argument",
        `Field "${fieldName}" has an invalid value.`
      );
    }
    sanitized[fieldName] = normalized.value;
  }

  return sanitized;
}

function diffSanitizedPatch(existingDoc, sanitizedPatch) {
  const changedFields = [];
  const before = {};
  const after = {};
  const updateData = {};

  for (const [fieldName, nextValue] of Object.entries(sanitizedPatch)) {
    const currentValue = serializeAuditValue(existingDoc[fieldName]);
    const normalizedNext = serializeAuditValue(nextValue);

    if (valuesEqual(currentValue, normalizedNext)) {
      continue;
    }

    changedFields.push(fieldName);
    before[fieldName] = currentValue;
    after[fieldName] = normalizedNext;
    updateData[fieldName] = normalizedNext;
  }

  return {
    changedFields,
    before,
    after,
    updateData,
  };
}

function createUpdateContentMetadataHandler({ adminLib, functionsLib }) {
  return async (data, context) => {
    const uid = String(context?.auth?.uid || "").trim();
    if (!uid) {
      throw getHttpsError(functionsLib, "unauthenticated", "Authentication is required.");
    }

    const collection = String(data?.collection || "").trim();
    const id = String(data?.id || "").trim();
    const reason = String(data?.reason || "").trim();

    if (!CONTENT_MANAGER_EDITABLE_FIELDS[collection]) {
      throw getHttpsError(functionsLib, "invalid-argument", "Unknown content collection.");
    }
    if (!id) {
      throw getHttpsError(functionsLib, "invalid-argument", "Content id is required.");
    }
    if (!reason) {
      throw getHttpsError(functionsLib, "invalid-argument", "Change reason is required.");
    }

    const db = adminLib.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw getHttpsError(functionsLib, "permission-denied", "Admin access is required.");
    }

    const contentRef = db.collection(collection).doc(id);
    const contentDoc = await contentRef.get();
    if (!contentDoc.exists) {
      throw getHttpsError(functionsLib, "not-found", "Content document not found.");
    }

    const sanitizedPatch = sanitizePatch(functionsLib, collection, data.patch || {});
    const diff = diffSanitizedPatch(contentDoc.data() || {}, sanitizedPatch);

    if (diff.changedFields.length === 0) {
      return {
        ok: true,
        changed: false,
        changedFields: [],
      };
    }

    const serverTimestamp = adminLib.firestore.FieldValue.serverTimestamp();
    const auditDocId = `${collection}__${id}`;
    const auditRef = db.collection("content_audit_logs").doc(auditDocId);
    const entryRef = auditRef.collection("entries").doc();
    const actorEmail =
      String(context?.auth?.token?.email || userDoc.data()?.email || "").trim() || null;

    const batch = db.batch();
    batch.set(
      contentRef,
      {
        ...diff.updateData,
        updatedAt: serverTimestamp,
      },
      { merge: true }
    );
    batch.set(
      auditRef,
      {
        collection,
        contentId: id,
        lastEditedAt: serverTimestamp,
      },
      { merge: true }
    );
    batch.set(entryRef, {
      createdAt: serverTimestamp,
      actorUid: uid,
      actorEmail,
      reason,
      changedFields: diff.changedFields,
      before: diff.before,
      after: diff.after,
    });

    await batch.commit();

    return {
      ok: true,
      changed: true,
      changedFields: diff.changedFields,
    };
  };
}

module.exports = {
  REGION,
  CONTENT_MANAGER_EDITABLE_FIELDS,
  sanitizePatch,
  diffSanitizedPatch,
  createUpdateContentMetadataHandler,
};
