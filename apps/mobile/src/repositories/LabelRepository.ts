import { executeSql, runSql } from '../db';

export interface Label {
    id: number;
    name: string;
    createdAt: string;
}

export const getAllLabels = async (): Promise<Label[]> => {
    return executeSql<Label>('SELECT * FROM labels ORDER BY name COLLATE NOCASE ASC');
};

export const createLabel = async (name: string): Promise<number> => {
    return runSql('INSERT INTO labels (name) VALUES (?)', [name.trim()]);
};

export const updateLabel = async (id: number, newName: string): Promise<void> => {
    // First, get the old name to update posts as well
    const labels = await executeSql<Label>('SELECT name FROM labels WHERE id = ?', [id]);
    if (labels.length === 0) return;
    const oldName = labels[0].name;

    await runSql('UPDATE labels SET name = ? WHERE id = ?', [newName.trim(), id]);

    // Update tags in posts. Since tags are stored as JSON string like '["Tag1","Tag2"]',
    // we need to be careful. A simple REPLACE might work but it's risky.
    // Ideally, we'd fetch all posts with that tag and update them.
    const posts = await executeSql<{ id: number; tags: string }>(
        'SELECT id, tags FROM posts WHERE tags LIKE ?',
        [`%${oldName}%`],
    );

    for (const post of posts) {
        try {
            const tags: string[] = JSON.parse(post.tags);
            const newTags = tags.map((t) => (t === oldName ? newName.trim() : t));
            await runSql('UPDATE posts SET tags = ? WHERE id = ?', [
                JSON.stringify(newTags),
                post.id,
            ]);
        } catch (e) {
            /* ignore parse errors */
        }
    }
};

export const deleteLabel = async (id: number): Promise<void> => {
    // Get label name first
    const labels = await executeSql<Label>('SELECT name FROM labels WHERE id = ?', [id]);
    if (labels.length === 0) return;
    const name = labels[0].name;

    await runSql('DELETE FROM labels WHERE id = ?', [id]);

    // Remove tag from posts
    const posts = await executeSql<{ id: number; tags: string }>(
        'SELECT id, tags FROM posts WHERE tags LIKE ?',
        [`%${name}%`],
    );

    for (const post of posts) {
        try {
            const tags: string[] = JSON.parse(post.tags);
            const newTags = tags.filter((t) => t !== name);
            await runSql('UPDATE posts SET tags = ? WHERE id = ?', [
                JSON.stringify(newTags),
                post.id,
            ]);
        } catch (e) {
            /* ignore parse errors */
        }
    }
};
