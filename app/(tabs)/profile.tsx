import { View, Text, FlatList, Pressable, ImageBackground } from 'react-native'
import React , {useState, useEffect} from 'react' 
import AppGradient from '@/components/AppGradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/utils/supabase'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import { MEDITATION_DATA } from '@/constants/MeditationData';
import MEDITATION_IMAGES from '@/constants/meditation-images';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile({ session }: { session: Session }) {
    const router = useRouter()
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
      <AppGradient colors={["FFFFFF", "FFFFFF"]}>
        <View className='mb-6 justify-center'>
            <Text className='text-black mb-3 font-bold text-4xl text-center'>
                {name}
            </Text>
            
            <Pressable
                className='h-32 w-32 rounded-full bg-white mx-auto mb-4'
            ></Pressable>
            <Text className='text-black text-xl font-medium text-center'>
                @user-name
            </Text>
            <Text className='text-black mb-3 font-bold text-xl text-center'>
                Age: {age}
            </Text>
            <Text className='text-black mb-3 font-bold text-xl text-center'>
                Disability: {disablity}
            </Text>
        </View>

        <View>
            <Pressable
            onPress={() => router.push("/editprofile")}
            className="h-48 my-3 rounded-md overflow-hidden"
            >
                <Text className='text-gray-100 text-3xl font-bold text-center'>Edit Profile</Text>
            </Pressable>
        </View>
      </AppGradient>

      <StatusBar style="light"/>
    </View>
  )
}

