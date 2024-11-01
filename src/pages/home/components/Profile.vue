<script setup lang="ts">
import { ref, watch }   from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IUser } from '@/entities/user.entity';
import { toBase64 } from '@/lib/utils';

const props = defineProps<{
  user: IUser;
  isCurrentUser: boolean;
}>();

const newAvatartImage = ref<string | undefined>(undefined);

const emit = defineEmits<{
  (e: 'updateUser', user: IUser): void;
}>();

const editedUser = ref<IUser>({ ...props.user });
const https_domain = import.meta.env.VITE_DOMAIN_HTTPS;

watch(() => props.user, (newUser) => {
  editedUser.value = { ...newUser };
}, { deep: true });

const handleSubmit = () => {
    const updatedUser: IUser = {
      id: editedUser.value.id,
      username: editedUser.value.username,
      bio: editedUser.value.bio,
      email: editedUser.value.email,
      profile_picture: newAvatartImage.value
    };

    emit('updateUser', updatedUser);
    newAvatartImage.value = undefined;
};

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const imageCode = await toBase64(file);
    newAvatartImage.value = imageCode;
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-center">
      <div class="w-32 h-32 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden">
        <img v-if="editedUser.profile_picture" :src="`${https_domain}/api/image?id=${editedUser.profile_picture}`" :alt="editedUser.username" class="w-full h-full object-cover">
        <p v-else class="text-4xl">{{ editedUser.username.charAt(0) }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <Label for="username">Username</Label>
        <Input id="username" v-model="editedUser.username" disabled />
      </div>

      <div>
        <Label for="email">Email</Label>
        <Input id="email" v-model="editedUser.email" type="email" :disabled="!isCurrentUser" />
      </div>

      <div>
        <Label for="bio">Bio</Label>
        <Textarea id="bio" v-model="editedUser.bio" :disabled="!isCurrentUser" />
      </div>

      <div v-if="isCurrentUser">
        <Label for="profile-picture-input">Profile Picture</Label>
        <Input id="profile-picture-input" type="file" accept="image/*" @change="handleFileChange" />
      </div>

      <Button v-if="isCurrentUser" type="submit">Update Profile</Button>
    </form>
  </div>
</template>