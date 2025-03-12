from django.db import models
from django.shortcuts import render,get_object_or_404
from users.models import User
from playlists.models import Playlist  # Import Playlist from playlists app

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Genre name (e.g., "Rock", "Pop")
    slug = models.SlugField(max_length=100, unique=True)  # URL-friendly version of the name
   

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']  # Order genres alphabetically by name

class Artist(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='artists/', blank=True, null=True)
    
    # If you want to store social media links
    website = models.URLField(blank=True, null=True)
    spotify = models.URLField(blank=True, null=True)
    
    # For featured artists
    is_featured = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    release_date = models.DateField()
    cover_image = models.ImageField(upload_to='album_covers/', null=True, blank=True)
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True, related_name='albums')
    is_featured = models.BooleanField(default=False)
    likes = models.ManyToManyField(User, related_name="liked_album", blank=True)
    
class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='songs')
    audio_file = models.FileField(upload_to='songs/')
    cover_image = models.ImageField(upload_to='covers/')
    upload_date = models.DateTimeField(auto_now_add=True)
    genre = models.ManyToManyField(Genre, related_name='songs')  # Many-to-Many relationship with Genre
    likes =  models.ManyToManyField(User, related_name="liked_songs", blank=True)
    plays = models.PositiveIntegerField(default=0)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="songs") 
    duration = models.DurationField(null=True, blank=True)


    def __str__(self):
        return self.title
    
class PlayHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='play_history')
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    played_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-played_at']

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='liked_songs', null=True, blank=True)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='album_likes', null=True, blank=True)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='playlist_likes', null=True, blank=True)
    liked_at = models.DateTimeField(auto_now_add=True)



def artist_detail(request, artist_id):
    artist = get_object_or_404(Artist, pk=artist_id)
    # Get all songs by this artist
    songs = Song.objects.filter(artist=artist).order_by('-created_at')
    return render(request, 'artist_detail.html', {
        'artist': artist,
        'songs': songs
    })

