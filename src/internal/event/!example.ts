// Replace with './+type' as the path when copying
import type { EventDefinition } from './public.js';


export default (() => {
    return {
        once: false,
        name: `guildMemberAdd`,
        description: `Event handler for \`guildMemberAdd\``,
        async response(client, member) {
            `New member:\n  id:${member.id}\n  tag:${member.user.tag}`;
        }
    };
}) satisfies EventDefinition<'guildMemberAdd'>;
