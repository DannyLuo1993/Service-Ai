
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';

export interface AIParameters {
  temperature: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
}

interface ParameterControlsProps {
  parameters: AIParameters;
  onChange: (parameters: AIParameters) => void;
  className?: string;
}

export const defaultParameters: AIParameters = {
  temperature: 0,
  topP: 0.2,
  topK: 40,
  frequencyPenalty: 0,
};

const ParameterControls = ({ parameters, onChange, className }: ParameterControlsProps) => {
  const handleChange = (key: keyof AIParameters, value: number[]) => {
    onChange({ ...parameters, [key]: value[0] });
  };

  return (
    <div className={cn('flex items-center justify-end', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8 px-3">
            <Settings2 className="h-3.5 w-3.5" />
            <span className="text-xs">Parameters</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-6">
            <h3 className="text-sm font-medium">Advanced Parameters</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="text-xs">Temperature</Label>
                  <span className="text-xs text-muted-foreground">{parameters.temperature.toFixed(2)}</span>
                </div>
                <Slider 
                  id="temperature"
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={[parameters.temperature]} 
                  onValueChange={(value) => handleChange('temperature', value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Controls randomness. Lower values for more deterministic responses.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top-p" className="text-xs">Top-P</Label>
                  <span className="text-xs text-muted-foreground">{parameters.topP.toFixed(2)}</span>
                </div>
                <Slider 
                  id="top-p"
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={[parameters.topP]} 
                  onValueChange={(value) => handleChange('topP', value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Controls diversity via nucleus sampling.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top-k" className="text-xs">Top-K</Label>
                  <span className="text-xs text-muted-foreground">{parameters.topK}</span>
                </div>
                <Slider 
                  id="top-k"
                  min={1} 
                  max={100} 
                  step={1} 
                  value={[parameters.topK]} 
                  onValueChange={(value) => handleChange('topK', value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Limits token selection to the top K options.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="frequency-penalty" className="text-xs">Frequency Penalty</Label>
                  <span className="text-xs text-muted-foreground">{parameters.frequencyPenalty.toFixed(2)}</span>
                </div>
                <Slider 
                  id="frequency-penalty"
                  min={0} 
                  max={2} 
                  step={0.01} 
                  value={[parameters.frequencyPenalty]} 
                  onValueChange={(value) => handleChange('frequencyPenalty', value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Reduces repetition by penalizing already-used tokens.
                </p>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ParameterControls;
