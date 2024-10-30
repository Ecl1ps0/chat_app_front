<script setup lang="ts">
import { onMounted, ref, watch }   from 'vue';
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

const initialProfilePicture = ref<string | undefined>(undefined);

const emit = defineEmits<{
  (e: 'updateUser', user: IUser): void;
}>();

const editedUser = ref<IUser>({ ...props.user });

watch(() => props.user, (newUser) => {
  editedUser.value = { ...newUser };
}, { deep: true });

const handleSubmit = () => {
    if(initialProfilePicture.value === editedUser.value.profile_picture) {
        editedUser.value.profile_picture = undefined;
    }
    emit('updateUser', editedUser.value);

    if (editedUser.value.profile_picture === undefined) {
        editedUser.value.profile_picture = initialProfilePicture.value;
    }
};

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const imageCode = await toBase64(file);
    editedUser.value.profile_picture = imageCode;
  }
};

onMounted(() => {
  initialProfilePicture.value = props.user.profile_picture;
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-center">
      <div class="w-32 h-32 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden">
        <img v-if="editedUser.profile_picture" :src="`http://127.0.0.1:8080/api/image?id=${editedUser.profile_picture}`" :alt="editedUser.username" class="w-full h-full object-cover">
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
        <Label for="profile-picture">Profile Picture</Label>
        <Input id="profile-picture" type="file" accept="image/*" @change="handleFileChange" />
      </div>

      <Button v-if="isCurrentUser" type="submit">Update Profile</Button>
    </form>
  </div>
</template>