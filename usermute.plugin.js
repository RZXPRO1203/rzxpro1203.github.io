const {
  Function,
  isPublic
} = require('../lib/');

const mutedUsers = new Set();

Function({
  pattern: 'umute ?(.*)',
  fromMe: isPublic,
  desc: 'Mutes a user in a group chat',
  type: 'admin',
}, async (message, match) => {
  if (!message.isGroup) {
    await message.reply('This command is only available in Group Chats.');
    return;
  }

  if (!message.isAdmin) {
    await message.reply('Only administrators can run this command.');
    return;
  }

  const targetUser = message.mentionedJidList[0];

  if (!targetUser) {
    await message.reply('Mutes a user. Use `.umute @User`.');
    return;
  }

  if (message.isAdmin) {
    await message.reply('Administrators cannot be muted.');
    return;
  }

  mutedUsers.add(targetUser);

  // Delete past and future messages from the muted user
  await deleteMessages(message, targetUser);

  await message.reply(`@${targetUser.split('@')[0]} muted.`);
});

Function({
  pattern: 'uunmute ?(.*)',
  fromMe: isPublic,
  desc: 'Unmutes a user in a group chat',
  type: 'admin',
}, async (message, match) => {
  if (!message.isGroup) {
    await message.reply('This command is only available in Group Chats.');
    return;
  }

  if (!message.isAdmin) {
    await message.reply('Only administrators can run this command.');
    return;
  }

  const targetUser = message.mentionedJidList[0];

  if (!targetUser) {
    await message.reply('Unmutes a user. Use `.uunmute @User`.');
    return;
  }

  if (!mutedUsers.has(targetUser)) {
    await message.reply('User isn\'t muted.');
    return;
  }

  mutedUsers.delete(targetUser);

  await message.reply(`Unmuted @${targetUser.split('@')[0]}.`);
});

// Helper function to delete messages from a specific user
async function deleteMessages(message, targetUser) {
  const chat = message.chat;

  // Delete past messages
  const pastMessages = await message.client.loadChatHistory(chat);
  const messagesToDelete = pastMessages.messages.filter(msg => msg.key.remoteJID === targetUser);
  for (const msg of messagesToDelete) {
    await message.client.deleteMessage(chat, msg.key);
  }

  // Listen for incoming messages and delete them
  const deleteListener = async (msg) => {
    if (msg.key.remoteJID === targetUser) {
      await message.client.deleteMessage(chat, msg.key);
    }
  };

  message.client.on('onMessage', deleteListener);

  // Set a timeout to stop listening after 10 seconds
  setTimeout(() => {
    message.client.off('onMessage', deleteListener);
  }, 10000);
}
