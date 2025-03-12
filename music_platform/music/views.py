from django.shortcuts import render,redirect,get_object_or_404
from .forms import SongForm
from .models import Album, Like, Song,PlayHistory,Genre,Artist
from playlists.models import Playlist  # Add this import
from django.db.models import Q
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from django.utils.timezone import now
from datetime import timedelta



# Create your views here.

def upload_song(request):
    if request.method == 'POST':
        form = SongForm(request.POST, request.FILES)
        if form.is_valid():
            song = form.save(commit=False)
            song.artist = request.user
            song.save()
            return redirect('home')
    else:
        form = SongForm()
    return render(request, 'upload_song.html', {'form': form})

def play_song(request, song_id):
    song = get_object_or_404(Song, id=song_id)
    
    # Only create play history for authenticated users
    if request.user.is_authenticated:
        PlayHistory.objects.create(user=request.user, song=song)
    
    # Increment play count
    song.plays += 1
    song.save()
    
    return render(request, 'player.html', {'song': song})


def search(request):
    query = request.GET.get('q', '')
    results = {
        'artists': [],
        'albums': [],
        'playlists': [],
        'songs': [],
    }
    
    if query:
        # Search for artists, albums, playlists, and songs that match the query
        results['artists'] = Artist.objects.filter(name__icontains=query)
        results['albums'] = Album.objects.filter(title__icontains=query)
        results['playlists'] = Playlist.objects.filter(name__icontains=query)
        results['songs'] = Song.objects.filter(title__icontains=query)
        
    return render(request, 'search.html', {
        'results': results,
        'query': query
    })
   

@login_required
def get_recommendations(request):
    try:
        user = request.user
        # Get songs from user's history
        played_songs = PlayHistory.objects.filter(user=user).values_list('song__id', flat=True)
        
        # Get recommendations based on played songs
        recommendations = Song.objects.filter(
            id__in=played_songs
        ).select_related('artist', 'album').distinct()[:20]
        
        context = {
            'recommendations': recommendations,
            'title': 'Recommended for You'
        }
        return render(request, 'get_recommendations.html', context)
    except Exception as e:
        messages.error(request, f'Error getting recommendations: {str(e)}')
        return redirect('home')


def home(request):
    # Get recent songs
    recent_plays = []
    if request.user.is_authenticated:
        recent_plays = PlayHistory.objects.filter(
            user=request.user
        ).select_related('song', 'song__artist').order_by('-played_at')[:5]
    
    # Get popular songs (based on play count)
    popular_songs = Song.objects.all().order_by('-plays')[:8]
    
    # Get featured artists
    featured_artists = Artist.objects.filter(is_featured=True)[:4]
    
    # Get featured albums
    featured_albums = Album.objects.filter(is_featured=True)[:4]
    
    # Get all genres for the genre section
    genres = Genre.objects.all()

      # If you're trying to get popular playlists, use this instead:
    popular_playlists = Playlist.objects.all()[:6]  # Get 6 recent playlists
    
     # You can show featured playlists or other content here
    featured_playlists = Playlist.objects.all().order_by('-created_at')[:5]  # recent 5 playlists

    # If user is authenticated, get their playlists
    user_playlists = []
    if request.user.is_authenticated:
        user_playlists = Playlist.objects.filter(user=request.user)
    
    # Create the context dictionary with all variables
    context = {
        'recent_plays': recent_plays,
        'popular_songs': popular_songs,
        'featured_artists': featured_artists,
        'featured_albums': featured_albums,
        'genres': genres,
        'user_playlists': user_playlists,
        'popular_playlists': popular_playlists,
    }
    
    return render(request, 'home.html', context)

@login_required
def play_history(request):
    try:
        play_history = PlayHistory.objects.select_related('song', 'song_artist').filter(
            user=request.user
        ).order_by('-played_at')

        if not play_history.exists():
            messages.info(request, "You haven't played any songs yet.")

        paginator = Paginator(play_history, 10)
        page = request.GET.get('page')
        play_history = paginator.get_page(page)

        context = {
            'play_history': play_history,
            'title': 'Your Listening History'
        }
        return render(request, 'play_history.html', context)
    except Exception as e:
        messages.error(request, f'Error loading play history: {str(e)}')
        return redirect('home')
    

def like_song(request, song_id):
    song = Song.objects.get(id=song_id)
    Like.objects.create(user=request.user, song=song)
    return JsonResponse({'status': 'success'})

def like_album(request, album_id):
    album = Album.objects.get(id=album_id)
    Like.objects.create(user=request.user, album=album)
    return JsonResponse({'status': 'success'})

def like_playlist(request, playlist_id):
    playlist = Playlist.objects.get(id=playlist_id)
    Like.objects.create(user=request.user, playlist=playlist)
    return JsonResponse({'status': 'success'})

def liked_items(request):
    liked_songs = Song.objects.filter(likes=request.user)  # ✅ Query Song model
    liked_albums = Album.objects.filter(likes=request.user)  # ✅ Query Album model
    liked_playlists = Playlist.objects.filter(likes=request.user)  # ✅ Query Playlist model
    return render(request, 'liked_items.html', {
        'liked_songs': liked_songs,
        'liked_albums': liked_albums,
        'liked_playlists': liked_playlists,
    })

def album_detail(request, album_id):
    album = Album.objects.get(id=album_id)
    songs = Song.objects.filter(album=album) 
    return render(request, 'album_detail.html', {'album': album})

def new_releases(request):
    """ Fetch albums released in the last 30 days """
    thirty_days_ago = now() - timedelta(days=30)
    new_albums = Album.objects.filter(release_date__gte=thirty_days_ago).order_by('-release_date')

    return render(request, 'new_releases.html', {'new_albums': new_albums})
    
def genre(request):
    genre = Genre.objects.all()
    return render(request, 'genre.html', {'genre': genre})

def genre_list(request):
    genre = Genre.objects.all()
    return render(request, 'genre_list.html', {'genre': genre})

def genre_detail(request, slug):
    genre = get_object_or_404(Genre, slug=slug)
    albums = genre.albums.all()  # Get albums for the selected genre
    songs = genre.songs.all()  # Get songs for the selected genre
    return render(request, 'genre_detail.html', {
        'genre': genre,
        'albums': albums,
        'songs': songs
    })

def artist_list(request):
    artist= Artist.objects.all().order_by('name')
    return render(request, 'artist.html', {'artist': artist})

def artist_detail(request, artist_id):
    artist = get_object_or_404(Artist, pk=artist_id)
    # You might want to get related albums or songs here
    songs = Song.objects.filter(artist=artist).order_by('-upload_date')
   
     # If user is authenticated, pass their playlists
    context = {
        'artist': artist,
        'songs': songs,
    }
    
    if request.user.is_authenticated:
        context['playlists'] = request.user.playlists.all()
    
    return render(request, 'artist_detail.html', context)

@login_required
def album_list(request):
    albums = Album.objects.all()
    return render(request, 'album_list.html', {'albums': albums})

@login_required
def song_list(request):
    songs = Song.objects.all()
    return render(request, 'song_list.html', {'songs': songs})

def song_detail(request, song_id):
    song = get_object_or_404(Song, id=song_id)
    return render(request, 'song_detail.html', {'song': song})