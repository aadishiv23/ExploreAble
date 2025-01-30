import { View, Text, FlatList, Pressable, ImageBackground } from 'react-native'
import React from 'react'
import AppGradient from '@/components/AppGradient'
import { StatusBar } from 'expo-status-bar'

import { MEDITATION_DATA } from '@/constants/MeditationData';
import MEDITATION_IMAGES from '@/constants/meditation-images';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet ,Image} from 'react-native';


const NatureMeditate = () => {
  return (
    <View className='flex-1 overflow-auto'>
      <StatusBar style='dark' backgroundColor='white'/>
      <View>
        <View className='mt-7 mb-0 w-full'>
            <Text className='text-black mt-12 mb-2 ml-4 font-semibold text-4xl text-left'>
                ExporAble
            </Text>
        </View>
        </View>
        <LinearGradient 
            colors={['blue', 'purple']} 
            start={[0, 0]}
            end={[1, 0]}
            className='flex self-center justify-self-center items-center justify-items-center w-3/4 h-1/4 rounded-2xl'
        > 
            <Text className='text-white self-center justify-self-center'>Weekly Progress</Text>
        </LinearGradient>
        <View>
            <FlatList
                data={MEDITATION_DATA}
                className='mb-20'
                keyExtractor={( item ) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Pressable
                    onPress={() => console.log("press")}
                    className="h-48 my-3 rounded-md overflow-hidden"
                    >
                        <ImageBackground
                            source={MEDITATION_IMAGES[item.id - 1]}
                            resizeMode='cover'
                            className='flex-1 rounded-lg justify-center'
                        >
                            <LinearGradient
                                colors={[
                                    "transparent",
                                    "rgba(0, 0, 0, 0.8)"
                                ]}
                                className='flex-1 justify-center items-center'
                            > 
                                <Text className='text-gray-100 text-3xl font-bold text-center'>{item.title}</Text>
                            </LinearGradient>
                        </ImageBackground>
                    </Pressable>
                )}
            />
        </View>
    </View>
  )
}

export default NatureMeditate;