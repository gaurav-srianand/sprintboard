function toJSON(row) {
  const clone = { ...row };
  clone.id = String(clone._id);
  delete clone._id;
  delete clone.__v;
  return clone;
}

function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }
    return String(row[key]) === String(value);
  });
}

export function createFakeModel() {
  const rows = [];
  let counter = 0;

  function nextId() {
    counter += 1;
    return counter.toString(16).padStart(24, "0");
  }

  return {
    rows,

    async create(doc) {
      const timestamp = new Date().toISOString();
      const row = { _id: nextId(), createdAt: timestamp, updatedAt: timestamp, ...doc };
      rows.push(row);
      return { toJSON: () => toJSON(row) };
    },

    find(query) {
      const found = rows
        .filter((row) => matches(row, query))
        .map((row) => ({ toJSON: () => toJSON(row) }));

      return {
        sort() {
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve(found).then(resolve, reject);
        },
      };
    },

    async findOne(query) {
      const row = rows.find((candidate) => matches(candidate, query));
      return row ? { toJSON: () => toJSON(row) } : null;
    },

    async findOneAndUpdate(query, update) {
      const row = rows.find((candidate) => matches(candidate, query));
      if (!row) {
        return null;
      }
      Object.assign(row, update.$set || {});
      row.updatedAt = new Date().toISOString();
      return { toJSON: () => toJSON(row) };
    },

    async deleteOne(query) {
      const index = rows.findIndex((candidate) => matches(candidate, query));
      if (index === -1) {
        return { deletedCount: 0 };
      }
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },

    async deleteMany(query) {
      let deletedCount = 0;
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if (matches(rows[i], query)) {
          rows.splice(i, 1);
          deletedCount += 1;
        }
      }
      return { deletedCount };
    },
  };
}

export const noConnect = async () => {};
