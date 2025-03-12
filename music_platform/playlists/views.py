import json
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from .forms import PlaylistForm
from .models import Playlist
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt 
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from music.models import Song
from django.views.decorators.http import require_POST

@login_required
def playlist_list(request):
    playlist = Playlist.objects.all()
    return render(request, 'playlists/playlist_list.html', {'playlists': playlist})

@login_required
def playlist_create(request):
    if request.method == 'POST':
        form = PlaylistForm(request.POST)
        if form.is_valid():
            playlist = form.save(commit=False)
            playlist.user = request.user  # Assuming the playlist is user-specific
            playlist.save()

            # Add selected songs to the playlist
            song_ids = request.POST.getlist('songs')  # Get selected song IDs
            songs = Song.objects.filter(id__in=song_ids)
            playlist.songs.set(songs)  # Associate songs with the playlist

            messages.success(request, 'Playlist created successfully!')
            return redirect('playlists:playlist_list')
    else:
        form = PlaylistForm()
    
    # Fetch all available songs to display in the form
    songs = Song.objects.all()
    return render(request, 'playlists/playlist_create.html', {'form': form, 'songs': songs})
    

def playlist_detail(request, pk):
    playlist = get_object_or_404(Playlist, pk=pk)
    return render(request, 'playlists/playlist_detail.html', {'playlist': playlist})




def edit_playlist(request, playlist_id):
    playlist = Playlist.objects.get(id=playlist_id)
    if request.method == 'POST':
        form = PlaylistForm(request.POST, instance=playlist)
        if form.is_valid():
            form.save()
            return redirect('playlist_detail', playlist_id=playlist.id)
    else:
        form = PlaylistForm(instance=playlist)
    return render(request, 'edit_playlist.html', {'form': form})

def share_playlist(request, playlist_id):
    playlist = Playlist.objects.get(id=playlist_id)
    send_mail(
        'Check out this playlist!',
        f'Here is the playlist: {playlist.name}. Enjoy!',
        'your_email@example.com',
        [request.POST.get('email')],
        fail_silently=False,
    )
    return JsonResponse({'status': 'success'})

@csrf_exempt
@login_required
def add_to_playlist(request):
    if request.method == 'POST':
        song_id = request.POST.get('song_id')
        playlist_id = request.POST.get('playlist_id')
        
        try:
            song = Song.objects.get(id=song_id)
            playlist = Playlist.objects.get(id=playlist_id, user=request.user)
            playlist.songs.add(song)
            messages.success(request, f"'{song.title}' added to '{playlist.name}'")
        except Song.DoesNotExist:
            messages.error(request, "Song not found.")
        except Playlist.DoesNotExist:
            messages.error(request, "Playlist not found or you don't have permission.")
            
        # Redirect back to the referring page
        return redirect(request.META.get('HTTP_REFERER', 'home'))
    
    return redirect('home')  # Default redirect if not a POST request




# Add this to playlists/views.py


def popular_playlists(request):
    # Get popular playlists (you might want to order by play count or likes)
    popular_playlists = Playlist.objects.all().order_by('-play_count')[:20]  # Adjust based on your model
    
    context = {
        'playlists': popular_playlists,
        'title': 'Popular Playlists'
    }
    
    return render(request, 'playlists/popular_playlists.html', context)


@login_required
@require_POST
def remove_song(request, playlist_id, song_id):
    playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
    song = get_object_or_404(Song, id=song_id)
    playlist.songs.remove(song)
    return JsonResponse({'success': True})