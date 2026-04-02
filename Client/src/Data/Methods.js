// --- HELPER FUNCTIONS (Required by Admin Components) ---

// GROUP BY
export const ObjectGroupBy = (object, group) => {
  var ans = {};
  if (!Array.isArray(object)) return ans;
  object.forEach(function (item) {
    var list = ans[item[group]];
    list ? list.push(item) : (ans[item[group]] = [item]);
  });
  return ans;
};

// KEY REPLACE
export const ObjectKeyReplace = (object, data, oldColumn, newColum) => {
  Object.keys(object).forEach((key) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i][oldColumn] === key) {
        var newKey = data[i][newColum];
        object[newKey] = object[key];
        delete object[key];
        break;
      }
    }
  });
  return object;
};

// SORT
export const TwoArraySort = (mainArray, secondaryArray) => {
  for (let i = 0; i < mainArray.length; i++) {
    for (let j = 0; j < mainArray.length - i - 1; j++) {
      if (mainArray[j] < mainArray[j + 1]) {
        [mainArray[j], mainArray[j + 1]] = [mainArray[j + 1], mainArray[j]];
        [secondaryArray[j], secondaryArray[j + 1]] = [
          secondaryArray[j + 1],
          secondaryArray[j],
        ];
      }
    }
  }
  return [mainArray, secondaryArray];
};

// COLOR GENERATOR
export const stringToColor = (string) => {
  if (!string) return "#000000";
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
};

// AVATAR INITIALS
export const stringToAv = (str) => {
  if (!str || typeof str !== "string") return "V";
  return str[0].toUpperCase();
};

// --- CORE LOGIC ---

// ✅ THE FIXED RESULT FUNCTION
export const getResult = async (transactions) => {
  let result = [];

  if (!transactions || !Array.isArray(transactions)) {
    console.warn("getResult: transactions is not a valid array");
    return result; 
  }

  transactions.forEach((tx) => {
    if (!tx) return;

    const data = tx.returnValues ? tx.returnValues : tx;

    const election_id = data.election_id ? data.election_id.toString() : null;
    const candidate_id = data.candidate_id ? data.candidate_id.toString() : null;

    if (!election_id || !candidate_id) return;

    let existing = result.find(r => r.election_id === election_id);

    if (!existing) {
      existing = {
        election_id: election_id,
        candidates: [],
        vote: []
      };
      result.push(existing);
    }

    const index = existing.candidates.indexOf(candidate_id);

    if (index === -1) {
      existing.candidates.push(candidate_id);
      existing.vote.push(1);
    } else {
      existing.vote[index]++;
    }
  });

  return result;
};