from django.db import models
from users.models import User



class Playlist(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
    songs = models.ManyToManyField('music.song', related_name='playlists')
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    play_count = models.IntegerField(default=0)
    likes = models.ManyToManyField(User, related_name="liked_playlists", blank=True) 
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
# Create your models here.
