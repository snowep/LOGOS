export interface ProjectMarkdown {
  id: string;
  name: string;
  slug: string;
  description?: string;
  goal?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  decisions?: string[];
  tasks?: string[];
}

export class MarkdownAdapter {
  static serialize(project: ProjectMarkdown): string {
    return `---
id: ${project.id}
type: project
slug: ${project.slug}
status: ${project.status}
created: ${project.createdAt}
updated: ${project.updatedAt}
---

# ${project.name}

## Goal
${project.goal || 'No goal set yet.'}

## Description
${project.description || 'No description provided.'}

## Decisions
${project.decisions && project.decisions.length > 0 ? project.decisions.map(d => `- ${d}`).join('\n') : '- None recorded yet.'}

## Tasks
${project.tasks && project.tasks.length > 0 ? project.tasks.map(t => `- [ ] ${t}`).join('\n') : '- No active tasks.'}
`;
  }

  static parse(markdown: string): Partial<ProjectMarkdown> {
    const lines = markdown.split('\n');
    const frontmatterEnd = lines.indexOf('---', 1);
    
    const result: Partial<ProjectMarkdown> = {};
    
    if (frontmatterEnd > 0) {
      const fmLines = lines.slice(1, frontmatterEnd);
      for (const line of fmLines) {
        const [key, ...val] = line.split(':');
        if (key && val) {
          const cleanKey = key.trim();
          const cleanVal = val.join(':').trim();
          if (cleanKey === 'id') result.id = cleanVal;
          if (cleanKey === 'slug') result.slug = cleanVal;
          if (cleanKey === 'status') result.status = cleanVal;
          if (cleanKey === 'created') result.createdAt = cleanVal;
          if (cleanKey === 'updated') result.updatedAt = cleanVal;
        }
      }
    }

    // Extract title
    const titleLine = lines.find(l => l.startsWith('# '));
    if (titleLine) {
      result.name = titleLine.replace('# ', '').trim();
    }

    return result;
  }
}
