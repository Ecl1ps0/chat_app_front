<script setup lang="ts">
import { IUser } from '@/entities/user.entity';
import { onMounted, ref, TransitionGroup, watch, nextTick } from 'vue';
import { useAuth } from '@/shared/stores/auth.store';
import { getAvailbleUsers } from '../api/users.api';
import { MessageSquareIcon, SendIcon, ImageIcon, XIcon } from 'lucide-vue-next';
import { router } from '@/pages/router/Router';
import { jwtDecode } from 'jwt-decode';
import { useChatSocket } from '../api/chat.api';
import { toBase64 } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

const users = ref<IUser[]>([]);
const newMessage = ref('');
const selectedFiles = ref<File[]>([]);
const isUploading = ref(false);
const imageUrls = ref<{ [messageId: string]: string[] }>({});
const { token, isAuthorized, isExpired } = useAuth();

const currentUser: IUser = jwtDecode<{ exp: number; user: IUser }>(token!).user;
const { messages, selectedUser, selectUser, sendMessage, closeConnection } = useChatSocket(currentUser.id);

const handleSelectUser = (user: IUser) => {
  if (selectedUser.value) {
    closeConnection();
  }
  selectUser(user);
};

const handleFileSelect = (event: Event) => {
  const fileList = (event.target as HTMLInputElement).files;
  if (fileList) {
    selectedFiles.value = Array.from(fileList);
  }
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (newMessage.value.trim() === '' && selectedFiles.value.length === 0) return;

  isUploading.value = true;
  try {
    const imageCodes: string[] = [];
    for (const file of selectedFiles.value) {
      const imageCode: string|null = await toBase64(file);

      imageCodes.push(imageCode);
    }

    await sendMessage(newMessage.value, imageCodes);
    newMessage.value = '';
    selectedFiles.value = [];
  } catch (e) {
    toast({
      title: (e as Error).name,
      description: `Error uploading files: ${(e as Error).message}`
    })
  } finally {
    isUploading.value = false;
  }
};

onMounted(async () => {
  if (!isAuthorized() || isExpired()) {
    router.push("/auth");
  } else {
    users.value = await getAvailbleUsers(token!);
  }
});

// Code for auto-scrolling
const messageContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

const getDelay = (index: number) => `${index * 50}ms`;

const beforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateY(100px)';
};

const enter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement;
  const delay = getDelay(Number(htmlEl.dataset.index));
  htmlEl.style.transition = `all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}`;
  htmlEl.style.opacity = '1';
  htmlEl.style.transform = 'translateY(0)';
  htmlEl.addEventListener('transitionend', done);
};

const leave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  htmlEl.style.opacity = '0';
  htmlEl.style.transform = 'translateY(100px)';
  htmlEl.addEventListener('transitionend', done);
};
</script>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.message-move {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
</style>

<template>
  <div class="flex h-screen bg-background text-foreground">
    <!-- User list sidebar -->
    <aside class="w-64 border-r bg-muted overflow-y-auto">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">Contacts</h2>
      </div>
      <ul>
        <li 
          v-for="user in users" 
          :key="user.id" 
          @click="handleSelectUser(user)"
          class="flex items-center p-4 hover:bg-muted-hover cursor-pointer transition-colors"
          :class="{ 'bg-primary/10': selectedUser?.id === user.id }"
        >
          <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-3">
            {{ user.username.charAt(0) }}
          </div>
          <div>
            <p class="font-medium">{{ user.username }}</p>
          </div>
        </li>
      </ul>
    </aside>

    <!-- Chat area -->
    <main class="flex-1 flex flex-col">
      <header v-if="selectedUser" class="border-b p-4 flex items-center">
        <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-3">
          {{ selectedUser.username.charAt(0) }}
        </div>
        <div>
          <h2 class="font-semibold">{{ selectedUser.username }}</h2>
        </div>
      </header>

      <div v-if="selectedUser" ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <TransitionGroup 
          name="message" 
          tag="ul" 
          class="space-y-4"
          :css="false"
          @before-enter="beforeEnter"
          @enter="enter"
          @leave="leave"
        >
          <li v-for="(message, index) in messages" :key="message.id" 
              :data-index="index"
              :class="[
                'flex',
                'items-start',
                'space-x-2',
                'p-4',
                'rounded-lg',
                'max-w-[80%]',
                message.sender === currentUser.id ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted',
                message.sender === currentUser.id ? 'flex-row-reverse' : 'flex-row'
              ]">
            <div :class="[
              'w-8',
              'h-8',
              'rounded-full',
              'flex',
              'items-center',
              'justify-center',
              'text-xs',
              'font-semibold',
              message.sender === currentUser.id ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
            ]">
              {{ message.sender === currentUser.id ? 'You' : selectedUser.username.charAt(0) }}
            </div>
            <div class="flex-1">
              <p>{{ message.text_content }}</p>
              <div v-if="message.image_content?.length > 0" class="mt-2 grid grid-cols-2 gap-2">
                <img v-for="(image, imgIndex) in message.image_content" :key="imgIndex" :src="image" alt="Uploaded image" class="rounded-md max-w-full h-auto"/>
              </div>
              <span class="text-xs text-muted-foreground mt-1 block">
                {{ new Date(message.timestamp * 1000).toLocaleString("en-GB", {
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit', 
                  hour12: false
                }) }}
              </span>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <div v-else class="flex-1 flex items-center justify-center bg-muted/30">
        <div class="text-center">
          <MessageSquareIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 class="text-xl font-semibold mb-2">Start a conversation</h2>
          <p class="text-muted-foreground">Select a contact to begin chatting</p>
        </div>
      </div>

      <footer v-if="selectedUser" class="border-t p-4">
        <form @submit.prevent="handleSubmit" class="space-y-2">
          <div class="flex space-x-2">
            <div class="relative flex-1">
              <input
                v-model="newMessage"
                type="text"
                placeholder="Type a message..."
                class="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <label class="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted-hover cursor-pointer">
              <ImageIcon class="h-5 w-5" />
              <input type="file" class="hidden" multiple @change="handleFileSelect" accept="image/*" />
            </label>
            <button
              type="submit"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              :disabled="isUploading"
            >
              <SendIcon v-if="!isUploading" class="h-5 w-5" />
              <span v-else class="loading loading-spinner loading-sm"></span>
            </button>
          </div>
          <div v-if="selectedFiles.length > 0" class="flex flex-wrap gap-2 mt-2">
            <div v-for="(file, index) in selectedFiles" :key="index" class="bg-muted rounded-md p-2 flex items-center">
              <span class="text-sm truncate max-w-[100px]">{{ file.name }}</span>
              <button @click="removeFile(index)" class="ml-2 text-muted-foreground hover:text-foreground">
                <XIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </footer>
    </main>
  </div>
</template>
