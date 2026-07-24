// Mock translation functions - returns original content without translation

export async function translateTaskContent(task, targetLocale, sourceLocale = 'en') {
  // Return task unchanged (no translation)
  return task
}

export async function translateTasksBatch(tasks, targetLocale, sourceLocale = 'en') {
  if (!Array.isArray(tasks) || tasks.length === 0) return tasks
  // Return tasks unchanged (no translation)
  return tasks
}
