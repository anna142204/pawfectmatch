<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import BackButton from '@/components/BackButton.vue';
import Button from '../../components/Button.vue';
import Menu from '@/components/Menu.vue';
import Toast from '@/components/Toast.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { useToast } from '@/composables/useToast';
import { ChevronLeft, CheckCircle } from 'lucide-vue-next';

const props = defineProps({
    userType: {
        type: String,
        required: true,
        validator: (value) => ['owner', 'adopter'].includes(value)
    }
});

const route = useRoute();
const router = useRouter();
const { userId, getAuthHeaders, getAuthFetchOptions } = useAuth();

const messageInput = ref('');
const messages = ref([]);
const conversationData = ref(null);
const isLoading = ref(true);
const isSendingMessage = ref(false);
const errorMessage = ref('');
const messagesList = ref(null);
const showAdoptModal = ref(false);
const isFinalizingAdoption = ref(false);

const { subscribeToChatMessages, unsubscribeFromChat, sendChatMessage, isConnected } = useWebSocket();
const { success: showSuccess, error: showError } = useToast();

const currentUser = computed(() => ({
    id: userId.value,
    type: props.userType === 'owner' ? 'Owner' : 'Adopter'
}));

const conversationId = computed(() => route.params.id);

const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const days = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));

    // Handle negative timestamps (future dates due to timezone issues)
    if (days < 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    if (days === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Hier';
    } else if (days < 7) {
        return `${props.userType === 'adopter' ? 'Il y a ' : ''}${days} jour${days > 1 ? 's' : ''}${props.userType === 'owner' ? ' ago' : ''}`;
    } else {
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
};

const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Aujourd'hui";
    if (isYesterday) return 'Hier';

    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
};

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
};

const scrollToBottom = () => {
    if (messagesList.value) {
        setTimeout(() => {
            messagesList.value.scrollTop = messagesList.value.scrollHeight;
        }, 0);
    }
};

const loadConversation = async () => {
    try {
        isLoading.value = true;

        const response = await fetch(`/api/matches/${conversationId.value}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load conversation');
        }

        const data = await response.json();
        conversationData.value = data;

        if (data.discussion && Array.isArray(data.discussion)) {
            messages.value = data.discussion.map(msg => ({
                ...msg,
                timestamp: msg.timestamp || msg.createdAt || new Date().toISOString()
            }));
        }

        // Marquer la conversation comme lue
        const lastReadKey = `lastRead_${conversationId.value}`;
        localStorage.setItem(lastReadKey, new Date().toISOString());

        scrollToBottom();
    } catch (err) {
        console.error('Error loading conversation:', err);
        errorMessage.value = 'Failed to load conversation. Please try again.';
    } finally {
        isLoading.value = false;
    }
};

const isOwnMessage = (msg) => {
    return msg.senderModel === currentUser.value.type;
};

const getSenderId = (msg) => {
    const sender = msg.sender;
    return sender && typeof sender === 'object' ? (sender._id || sender.id) : sender;
};

const getTimestamp = (msg) => {
    if (!msg.timestamp) return Date.now();
    const ts = msg.timestamp;
    if (typeof ts === 'number') return ts;
    return new Date(ts).getTime();
};

const handleNewMessage = (message) => {
    const newSenderId = String(getSenderId(message));
    const newMessage = String(message.message || '').trim();
    const newTimestamp = getTimestamp(message);

    const msgExists = messages.value.some(m => {
        const existingSenderId = String(getSenderId(m));
        const existingMessage = String(m.message || '').trim();
        const existingTimestamp = getTimestamp(m);

        const sameSenderAndMessage = existingSenderId === newSenderId && existingMessage === newMessage;
        const timestampDiff = Math.abs(existingTimestamp - newTimestamp);
        const similarTimestamp = timestampDiff < 1000;

        return sameSenderAndMessage && similarTimestamp;
    });

    if (!msgExists) {
        messages.value.push({
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
        });
        scrollToBottom();
    } else {
        console.log('Duplicate message prevented:', message.message);
    }
};

const sendMessage = async () => {
    if (!messageInput.value.trim()) return;

    try {
        isSendingMessage.value = true;

        const httpPayload = {
            sender: userId.value,
            senderModel: currentUser.value.type,
            message: messageInput.value.trim()
        };

        const response = await fetch(`/api/matches/${conversationId.value}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(httpPayload)
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const result = await response.json();

        if (isConnected.value) {
            try {
                await sendChatMessage(conversationId.value, {
                    senderModel: currentUser.value.type,
                    message: httpPayload.message
                });
            } catch (wsError) {
                console.warn('WebSocket broadcast failed, adding message locally:', wsError?.message || wsError);
                const added = result?.match?.discussion?.[result.match.discussion.length - 1] || {
                    ...httpPayload,
                    timestamp: new Date().toISOString()
                };
                handleNewMessage(added);
            }
        } else {
            const added = result?.match?.discussion?.[result.match.discussion.length - 1] || {
                ...httpPayload,
                timestamp: new Date().toISOString()
            };
            handleNewMessage(added);
        }

        messageInput.value = '';
    } catch (err) {
        console.error('Error sending message:', err);
        errorMessage.value = 'Failed to send message. Please try again.';
    } finally {
        isSendingMessage.value = false;
    }
};

const adopterInfo = computed(() => {
    if (!conversationData.value || !conversationData.value.adopterId) return null;
    return conversationData.value.adopterId;
});

const animalInfo = computed(() => {
    if (!conversationData.value || !conversationData.value.animalId) return null;
    return conversationData.value.animalId;
});

const ownerInfo = computed(() => {
    return conversationData.value?.animalId?.ownerId || null;
});

const headerTitle = computed(() => {
    if (props.userType === 'owner') {
        return animalInfo.value?.name || 'Conversation';
    } else {
        return animalInfo.value?.name || 'Conversation';
    }
});

const headerInfo = computed(() => {
    if (props.userType === 'owner') {
        return adopterInfo.value;
    } else {
        return ownerInfo.value;
    }
});

const finalizeAdoption = async () => {
    try {
        isFinalizingAdoption.value = true;

        const response = await fetch(`/api/matches/${conversationId.value}/adopt`, getAuthFetchOptions({
            method: 'PATCH'
        }));

        if (!response.ok) {
            throw new Error('Failed to finalize adoption');
        }

        showAdoptModal.value = false;
        showSuccess('Adoption finalisée avec succès ! 🎉');

        setTimeout(() => {
            router.push('/owner/discussions');
        }, 1500);
    } catch (err) {
        console.error('Error finalizing adoption:', err);
        showError('Erreur lors de la finalisation');
    } finally {
        isFinalizingAdoption.value = false;
    }
};

onMounted(async () => {
    await loadConversation();

    if (!userId.value) {
        router.push('/login');
        return;
    }

    try {
        await subscribeToChatMessages(conversationId.value, handleNewMessage);
    } catch (err) {
        console.error('Failed to subscribe to chat:', err);
        errorMessage.value = 'Failed to connect to real-time chat.';
    }
});

onUnmounted(async () => {
    try {
        await unsubscribeFromChat(conversationId.value);
    } catch (err) {
        console.error('Error unsubscribing from chat:', err);
    }
});
</script>

<template>
    <div class="conversation-container" :class="`conversation-container-${userType}`">
        <!-- Header -->
        <div class="conversation-header">
            <BackButton />
            <div class="header-title">
                <h1 class="title-text text-h3">{{ headerTitle }}</h1>
            </div>

            <div class="header-right">
                <RouterLink v-if="userType === 'owner' && adopterInfo?._id"
                    :to="{ name: 'OwnerProfileAdopter', params: { id: adopterInfo._id } }" class="user-info clickable">
                    <div class="user-avatar" :class="{ 'placeholder': !headerInfo?.image }">
                        <img v-if="headerInfo?.image" :src="headerInfo.image" :alt="headerInfo.firstName" />
                        <span v-else>{{ headerInfo?.firstName?.charAt(0) }}</span>
                    </div>
                    <p class="user-name text-label-base">{{ headerInfo?.firstName }} {{ headerInfo?.lastName?.charAt(0)
                        }}.</p>
                </RouterLink>
                <div v-else class="user-info">
                    <div class="user-avatar" :class="{ 'placeholder': !headerInfo?.image }">
                        <img v-if="headerInfo?.image" :src="headerInfo.image" :alt="headerInfo.firstName" />
                        <span v-else>{{ headerInfo?.firstName?.charAt(0) }}</span>
                    </div>
                    <p class="user-name text-label-base">{{ headerInfo?.firstName }} {{ headerInfo?.lastName?.charAt(0)
                        }}.</p>
                </div>
            </div>
        </div>

        <div v-if="userType === 'owner' && conversationData?.status === 'validé'" class="adoption-action">
            <Button variant="secondary" size="sm" @click="showAdoptModal = true" class="adopt-button" :disabled="isFinalizingAdoption">
                <CheckCircle :size="20" />
                Finaliser l'adoption
            </Button>
        </div>

        <div class="messages-container" ref="messagesList">
            <div v-if="isLoading" class="loading text-body-base">Chargement...</div>
            <div v-else-if="messages.length === 0" class="empty-state text-body-base">
                <p>Aucun message pour le moment. Commencez la conversation !</p>
            </div>
            <div v-else class="messages-list">
                <template v-for="(message, index) in messages" :key="index">

                    <div v-if="shouldShowDateSeparator(message, messages[index - 1])" class="date-separator">
                        <span class="date-text">{{ formatDateSeparator(message.timestamp) }}</span>
                    </div>

                    <div class="message-item" :class="isOwnMessage(message) ? 'own-message' : 'other-message'">
                        <div v-if="!isOwnMessage(message)" class="message-avatar"
                            :class="!headerInfo?.image ? 'placeholder' : ''">
                            <img v-if="headerInfo?.image" :src="headerInfo.image" :alt="headerInfo.firstName" />
                            <span v-else>{{ headerInfo?.firstName?.charAt(0) }}</span>
                        </div>

                        <!-- Message Content -->
                        <div class="message-content">
                            <div class="message-header">
                                <p class="name text-body-sm" :class="isOwnMessage(message) ? 'name-right' : ''">
                                    {{ isOwnMessage(message) ? 'Vous' : (headerInfo?.firstName || 'Utilisateur') }}
                                </p>
                                <span class="time text-label-sm">{{ formatTime(message.timestamp) }}</span>
                            </div>
                            <div class="message-bubble" :class="isOwnMessage(message) ? 'own' : 'other'">
                                <p class="text-body-base">{{ message.message }}</p>
                            </div>
                        </div>

                        <div v-if="isOwnMessage(message)" class="message-avatar"
                            :class="!currentUser.image ? 'placeholder' : ''">
                            <span>{{ headerInfo?.firstName?.charAt(0) || 'V' }}</span>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <div class="message-input-container">
            <div class="text-area">
                <input v-model="messageInput" type="text" class="input" placeholder="Écrire un message..."
                    @keyup.enter="sendMessage" :disabled="isSendingMessage" />
                <button class="send-button" @click="sendMessage" :disabled="!messageInput.trim() || isSendingMessage">
                    <ChevronLeft :size="26" />
                </button>
            </div>
        </div>
    </div>

    <Menu :userType="userType" />

    <Toast />

    <ConfirmModal v-if="showAdoptModal" :show="showAdoptModal" title="Finaliser l'adoption"
        message="Êtes-vous sûr de vouloir finaliser cette adoption ? L'animal ne sera plus disponible et le match sera marqué comme adopté."
        confirmText="Confirmer" cancelText="Annuler" @confirm="finalizeAdoption" @cancel="showAdoptModal = false" />
</template>

<style scoped>
.conversation-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 90px);
    position: relative;
    padding-bottom: 0;
}

.conversation-container {
    background: var(--color-primary-50);
}

.conversation-header {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 20px 30px;
    position: relative;
    z-index: 10;
    background: var(--color-primary-50);
    gap: 16px;
}

.back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: var(--color-neutral-black, #410054);
    flex-shrink: 0;
}

.back-button:hover {
    opacity: 0.7;
}

.header-title {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.title-text {
    color: var(--color-neutral-black);
    margin: 0;
}

.header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.user-info.clickable {
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;
    border-radius: 12px;
    padding: 8px;
    margin: -8px;
}

.user-info.clickable:hover {
    opacity: 0.8;
    transform: scale(1.05);
}

.user-info.clickable:active {
    transform: scale(0.98);
}

.user-name {
    color: var(--color-neutral-black);
    margin: 0;
    white-space: nowrap;
    text-align: center;
}

.user-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    overflow: hidden;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-200);
    color: var(--color-primary-700);
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 33px 24px;
    display: flex;
    flex-direction: column;
    gap: 27px;
}

.messages-container {
    background: linear-gradient(180deg, rgba(252, 243, 255, 0.2) 76.923%, rgba(100, 18, 125, 0.2) 100%),
        linear-gradient(90deg, rgba(253, 249, 255, 1) 0%, rgba(253, 249, 255, 1) 100%);
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
    box-shadow: var(--shadow-base);
}

.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-neutral-black);
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-neutral-black);
    opacity: 0.6;
    padding: 20px;
}

.messages-list {
    display: flex;
    flex-direction: column;
    gap: 27px;
}

/* Date Separator */
.date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 16px 0;
    position: relative;
}

.date-separator::before,
.date-separator::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-primary-300);
    opacity: 0.3;
}

.date-text {
    color: var(--color-primary-700);
    text-transform: capitalize;
    padding: 0 12px;
    background: linear-gradient(180deg, rgba(252, 243, 255, 0.9) 0%, rgba(253, 249, 255, 0.9) 100%);
    border-radius: 12px;
    white-space: nowrap;
}

/* Message Item */
.message-item {
    display: flex;
    gap: 11px;
    align-items: flex-start;
}

.message-item.own-message {
    justify-content: flex-end;
}

.conversation-container .message-item.own-message,
.conversation-container-adopter .message-item.own-message {
    padding-left: 20px;
}

.message-item.other-message {
    justify-content: flex-start;
}

.conversation-container .message-item.other-message,
.conversation-container-adopter .message-item.other-message {
    padding-right: 20px;
}

.message-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.message-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.message-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-200, #d9b3f0);
    color: var(--color-primary-700, #8d0fbc);
    font-family: 'Comfortaa', sans-serif;
    font-size: 24px;
    font-weight: 700;
}

.message-content {
    display: flex;
    flex-direction: column;
    gap: 7px;
    max-width: 70%;
    flex: 1;
}

.message-item.own-message .message-content {
    align-items: flex-end;
}

.message-item.other-message .message-content {
    align-items: flex-start;
}

.message-header {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
}

.message-item.own-message .message-header {
    justify-content: flex-end;
}

.message-item.other-message .message-header {
    justify-content: flex-start;
}

.message-header .name {
    color: var(--color-neutral-black);
    margin: 0;
    order: 1;
}

.message-header .name-right {
    color: var(--color-neutral-black);
    margin: 0;
    order: 2;
}

.message-header .time {
    color: var(--color-neutral-black);
    margin: 0;
    white-space: nowrap;
}

.message-item.own-message .message-header .time {
    order: 1;
}

.message-item.other-message .message-header .time {
    order: 2;
}

.message-bubble {
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: var(--shadow-base);
    max-width: 100%;
    word-wrap: break-word;
}

.message-bubble p {
    margin: 0;
    word-wrap: break-word;
}

.message-bubble.own {
    background: var(--color-primary-700, #8d0fbc);
    border-radius: 8px 8px 8px 8px;
}

.message-bubble.own p {
    color: var(--color-neutral-white);
}

.message-bubble.other {
    background: var(--color-primary-200);
    border-radius: 8px 8px 8px 8px;
}

.message-bubble.other p {
    color: var(--color-neutral-black);
}

.adoption-action {
    padding: 8px 24px 16px 24px ;
    background: var(--color-primary-50);
    border-bottom: 1px solid var(--color-primary-200);
    display: flex;
    justify-content: center;
    align-items: center;
}

.adopt-button {
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
    gap: 8px;
    width: 80%;
}


.message-input-container {
    padding: 22px 24px 30px;
    background: linear-gradient(180deg, rgba(252, 243, 255, 0.2) 0%, rgba(100, 18, 125, 0.2) 100%);
}

.conversation-container .message-input-container,
.conversation-container-adopter .message-input-container {
    padding: 22px 38px 30px;
}

.text-area {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--color-neutral-white);
    border-radius: 16px;
    padding: 10px 14px;
    box-shadow: var(--shadow-base);
}

.input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: var(--font-family);
    font-size: 16px;
    color: var(--color-neutral-black);
    outline: none;
    line-height: 16px;
}

.input::placeholder {
    color: rgba(7, 1, 10, 0.24);
}

.send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: var(--color-accent-400);
    border-radius: 30px;
    cursor: pointer;
    padding: 10px;
    color: white;
    transition: opacity 0.2s;
    flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
    opacity: 0.9;
}

.send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.messages-container::-webkit-scrollbar {
    width: 8px;
}

.messages-container::-webkit-scrollbar-track {
    background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
    background: var(--color-primary-200, #ecf);
    border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary-300, #d4a9e6);
}
</style>
