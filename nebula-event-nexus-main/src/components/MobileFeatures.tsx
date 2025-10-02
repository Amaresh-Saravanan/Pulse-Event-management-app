import React from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, Share2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useMobile } from '@/hooks/useMobile';

interface MobileFeaturesProps {
  onImageCapture?: (imageUrl: string) => void;
  onLocationCapture?: (lat: number, lng: number) => void;
  shareData?: {
    title: string;
    text: string;
    url: string;
  };
}

export const MobileFeatures: React.FC<MobileFeaturesProps> = ({
  onImageCapture,
  onLocationCapture,
  shareData
}) => {
  const { isNative } = useMobile();

  const takePicture = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath && onImageCapture) {
        onImageCapture(image.webPath);
        toast.success('Photo captured successfully!');
      }
    } catch (error) {
      toast.error('Failed to capture photo');
      console.error('Camera error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      
      const coordinates = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = coordinates.coords;
      
      if (onLocationCapture) {
        onLocationCapture(latitude, longitude);
        toast.success('Location captured successfully!');
      }
    } catch (error) {
      toast.error('Failed to get location');
      console.error('Location error:', error);
    }
  };

  const shareContent = async () => {
    if (!shareData) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      
      await Share.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url,
        dialogTitle: 'Share Event'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!isNative) {
    return null; // Don't show mobile features on web
  }

  return (
    <div className="flex gap-2">
      {onImageCapture && (
        <Button
          variant="outline"
          size="sm"
          onClick={takePicture}
          className="gap-2"
        >
          <CameraIcon className="w-4 h-4" />
          Photo
        </Button>
      )}
      
      {onLocationCapture && (
        <Button
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="gap-2"
        >
          <MapPin className="w-4 h-4" />
          Location
        </Button>
      )}
      
      {shareData && (
        <Button
          variant="outline"
          size="sm"
          onClick={shareContent}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      )}
    </div>
  );
};
