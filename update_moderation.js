import fs from 'fs';

const path = 'src/routes/_authenticated/dashboard.$guildId.moderation.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports if not present
if (!content.includes('import { getAutomodConfig }')) {
  content = "import { getAutomodConfig } from '@/lib/guild/modules.functions';\n" + content;
}
if (!content.includes('import { AutomodTab }')) {
  content = "import { AutomodTab } from '@/components/dashboard/moderation/AutomodTab';\n" + content;
}

// Update loader data
content = content.replace(
  'const { user, config, stats } = Route.useLoaderData();',
  'const { user, config, stats, automodConfig } = Route.useLoaderData();'
);

// Update tabs trigger filter
content = content.replace(
  '["permissions", "punishments", "automod",',
  '["permissions", "punishments",'
);

// Add AutomodTab content
const generalTabEnd = '</TabsContent>';
const automodTab = `
        <TabsContent value="automod" className="mt-4">
          <AutomodTab guildId={guildId} initial={automodConfig} />
        </TabsContent>`;

if (!content.includes('value="automod"')) {
    // Find the first </TabsContent> (which is for general) and append automod tab after it
    const index = content.indexOf(generalTabEnd);
    if (index !== -1) {
        content = content.slice(0, index + generalTabEnd.length) + automodTab + content.slice(index + generalTabEnd.length);
    }
}

fs.writeFileSync(path, content);
