from django.shortcuts import render, redirect
from django.contrib.auth import login, logout,get_user_model,authenticate
from .forms import RegisterForm, DocumentForm, ProfileForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.apps import apps
from django.conf import settings
from playlists.models import Playlist
from music.models import Song, Album, PlayHistory
from django.db.models import Count


def register(request):
    User = get_user_model()

    if request.method == 'POST':
        # Get form data
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        # Validation checks
        if password1 != password2:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'register.html')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return render(request, 'register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, 'register.html')

        # Create user
        try:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password1
            )
             # Authenticate the user
            #authenticated_user = authenticate(request, username=username, password1=password1)

            #if authenticated_user:
            # Optional: Log the user in immediately after registration
            login(request,user)

            messages.success(request, 'Registration successful!')
            return redirect('home')  # Redirect to home page after successful registration
        
        except Exception as e:
            messages.error(request, f'Registration failed: {str(e)}')
            return render(request, 'register.html')

    # GET request
    return render(request, 'register.html')


def upload_document(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('success')
        
    else:
        form = DocumentForm()
    return render(request, 'users/upload_document.htlm', {'form':form})


def upload_profile(request):
    if request.method=='POST':
        form=ProfileForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('success')
    else:
        form=ProfileForm()

@login_required
def profile(request):
    return render(request, 'users/profile.html')

@login_required
def settings(request):
    user = request.user
    # ✅ Set a default value for `profile_picture` before using it
    profile_picture = None  # Prevents UnboundLocalError

    if hasattr(user, 'profile'):
        profile_picture = user.profile.picture  # Assign if it exists

    return render(request, 'users/settings.html', {'profile_picture': profile_picture})

def user_logout(request):
    logout(request)
    messages.success(request, "You have been successfully logged out.")
    return render(request,'logout.html')  # Redirects directly to login page

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        print(f"User object: {user}")
        
        if user is not None:
            
            login(request, user)  # Log the user in
            messages.success(request, 'Login successful!')
            return redirect('home')  # Redirect to the homepage
        else:
            # Handle invalid login
            messages.error(request, 'Invalid username or password.')
            return render(request, 'login.html', {'error': 'Invalid credentials'})
    return render(request, 'login.html')

def library(request):
    user=request.user

     # Fetch user playlists
    playlists = Playlist.objects.filter(user=user)

    # Fetch liked songs
    liked_songs = user.liked_songs.all()  # Adjust according to your model

    # Fetch user's albums (if they own albums)
    albums = Album.objects.filter(artist=user)  # Adjust ownership logic

    # Frequently listened to songs (top 5)
    frequently_played_songs = (
        PlayHistory.objects.filter(user=user)
        .values('song')
        .annotate(play_count=Count('song'))
        .order_by('-play_count')[:5]
    )

    # Frequently listened to albums (based on songs played)
    frequently_played_albums = (
        PlayHistory.objects.filter(user=user)
        .values('song__album')
        .annotate(play_count=Count('song__album'))
        .order_by('-play_count')[:5]
    )

    # Frequently listened to artists
    frequently_played_artists = (
        PlayHistory.objects.filter(user=user)
        .values('song__artist')
        .annotate(play_count=Count('song__artist'))
        .order_by('-play_count')[:5]
    )

    context = {
        "playlists": playlists,
        "liked_songs": liked_songs,
        "albums": albums,
        "frequently_played_songs": frequently_played_songs,
        "frequently_played_albums": frequently_played_albums,
        "frequently_played_artists": frequently_played_artists,
    }

    return render(request, "library.html", context)