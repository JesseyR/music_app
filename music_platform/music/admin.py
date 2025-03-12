from django.contrib import admin
from .models import Album, Song, Like,Artist,Genre, PlayHistory

#admin.site.register(Album)
#admin.site.register(Song)
admin.site.register(PlayHistory)
admin.site.register(Like)
@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_featured')
    list_filter = ('is_featured',)
    search_fields = ('name',)

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist')

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'album')
    filter_horizontal = ('genre',)  # Makes it easier to select genres


