import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const CHANNELS = [
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'meta', label: 'Meta Ads', icon: '📘' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'google', label: 'Google', icon: '🔍' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'organic', label: 'Orgânico', icon: '🌱' },
] as const;

interface StepChannelsProps {
  formData: {
    primaryChannel: string;
    secondaryChannel: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function StepChannels({ formData, onUpdate }: StepChannelsProps) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Canais de aquisição
        </h3>
        <p className="text-sm text-zinc-500">
          De onde vem seu tráfego principal?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Canal principal *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.map((channel) => (
            <motion.button
              key={channel.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate('primaryChannel', channel.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                formData.primaryChannel === channel.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02]'
              )}
            >
              <span className="text-2xl">{channel.icon}</span>
              <span className={cn(
                'text-sm',
                formData.primaryChannel === channel.id ? 'text-white' : 'text-zinc-400'
              )}>
                {channel.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Canal secundário (opcional)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.filter((c) => c.id !== formData.primaryChannel).map((channel) => (
            <motion.button
              key={channel.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onUpdate(
                  'secondaryChannel',
                  formData.secondaryChannel === channel.id ? '' : channel.id
                )
              }
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                formData.secondaryChannel === channel.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02]'
              )}
            >
              <span className="text-2xl">{channel.icon}</span>
              <span className={cn(
                'text-sm',
                formData.secondaryChannel === channel.id ? 'text-white' : 'text-zinc-400'
              )}>
                {channel.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

