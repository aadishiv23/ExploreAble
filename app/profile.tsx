import { View, Text, FlatList, Pressable, ImageBackground } from 'react-native'
import React , {useState, useEffect} from 'react' 
import AppGradient from '@/components/AppGradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/utils/supabase'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

import { MEDITATION_DATA } from '@/constants/MeditationData';
import MEDITATION_IMAGES from '@/constants/meditation-images';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile({ session }: { session: Session }) {
    const [loading, setLoading] = useState(true)
    //TODO change to empty quote when we get authentication working
    const [name, setName] = useState('Full Name')
    const [disablity, setDisability] = useState('wheelchair user')
    const [age, setAge] = useState(0)
    const [pfp, setPfp] = useState('')
        

    useEffect(() => {
        if (session) getProfile()
    }, [session])

    async function getProfile(){
        try {
            setLoading(true);
            if (!session?.user) throw new Error("No user on the session");

            const {data, error, status} = await supabase
                .from("profiles")
                .select("name, age, disability, pfpUrl")
                .eq("id", session?.user.id)
                .single()
            if (error && status !== 406){
                throw error
            }

            if (data) {
                setName(data.name)
                setAge(data.age)
                setDisability(data.disability)
                setPfp(data.pfpUrl)
            }
        } catch (error) {
            if (error instanceof Error) {
              alert(error.message)
            }
        } finally {
            setLoading(false)
        }


    }

  return (
    <View className='flex-1'>
      <AppGradient colors={["#161b2e", "#0a4d4a", "#766e67"]}>
        <View className='mb-6 justify-center'>
            <Text className='text-gray-200 mb-3 font-bold text-4xl text-center'>
                {name}
            </Text>
            
            <Pressable
                className='h-32 w-32 rounded-full bg-white mx-auto mb-4'
            ></Pressable>
            <Text className='text-indigo-100 text-xl font-medium text-center'>
                @user-name
            </Text>
            <Text className='text-gray-200 mb-3 font-bold text-xl text-center'>
                Age: {age}
            </Text>
            <Text className='text-gray-200 mb-3 font-bold text-xl text-center'>
                Disability: {disablity}
            </Text>
        </View>

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
      </AppGradient>

      <StatusBar style="light"/>
    </View>
  )
}

