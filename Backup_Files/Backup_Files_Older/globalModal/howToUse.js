openModal('deleteMessage', {
  title: 'Delete Message',
  message: 'Are you sure you want to delete this message?',
  onConfirm: () => deleteMessage(messageId),
});

openModal('editMessage', {
  title: 'Edit Message',
  message: existingMessage,
  onChange: (e) => setEditedMessage(e.target.value),
  onConfirm: () => saveEditedMessage(editedMessage),
});

openModal('form', {
  title: 'Submit Feedback',
  children: (
    <form>
      <input
        type="text"
        placeholder="Your name"
        className="border p-2 w-full"
      />
      <textarea
        placeholder="Your feedback"
        className="border p-2 w-full mt-2"
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-2">
        Submit
      </button>
    </form>
  ),
});
